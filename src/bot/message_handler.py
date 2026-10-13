"""BotMessageHandler - Non-blocking message processor with per-chat task isolation."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from imports import parse_consent_reply, printer


if TYPE_CHECKING:
    from imports import IncomingMessage

    from .commands.registry import BotCommandDispatcher
    from .config import BotConfig
    from .consent import ConsentBroker
    from .streaming import StreamingResponseManager
    from .transport import MessagingTransport
    from .user_client_manager import UserClientManager
    from .user_identity import UserIdentityManager


CONSENT_CONFIRMATIONS = {"yes": "Approved.", "yes_all": "Approved all.", "no": "Denied."}


class BotMessageHandler:
    def __init__(
        self,
        transport: MessagingTransport,
        user_identity: UserIdentityManager,
        streaming_manager: StreamingResponseManager,
        config: BotConfig,
        user_client_manager: UserClientManager,
        consent_broker: ConsentBroker,
        command_dispatcher: BotCommandDispatcher | None = None,
    ) -> None:
        self._transport = transport
        self._user_identity = user_identity
        self._streaming = streaming_manager
        self._config = config
        self._user_client_manager = user_client_manager
        self._consent = consent_broker
        self._command_dispatcher = command_dispatcher

        # One in-flight reply per chat, keyed by chat id.
        self._active_tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    async def handle(self, incoming: IncomingMessage) -> None:
        chat_id = incoming.chat_id

        if await self._answer_consent(incoming):
            return

        printer.info(f"Received message: {incoming.text}")

        if self._command_dispatcher and incoming.text and incoming.text.startswith("/"):
            try:
                result = await self._command_dispatcher.try_dispatch(incoming, self._user_identity)
                if result is not None:
                    await self._transport.send_message(chat_id=chat_id, text=result.message)
                    return
            except Exception as e:
                printer.error(f"Command dispatch error: {e}")
                await self._send_error_message(incoming, str(e))

        async with self._lock:
            if chat_id in self._active_tasks:
                asyncio.create_task(self._send_busy_hint(incoming), name=f"busy-hint-{chat_id}")
                return

            task = asyncio.create_task(
                self._process_message(incoming),
                name=f"process-{chat_id}-{(incoming.message_id or 'unknown')[:8]}",
            )
            self._active_tasks[chat_id] = task
            task.add_done_callback(lambda t: self._cleanup_callback(chat_id, t))

            printer.info(f"Started processing task for chat {chat_id} (message: {incoming.message_id})")

    async def cancel_all(self, timeout: float = 5.0) -> None:
        async with self._lock:
            if not self._active_tasks:
                printer.info("No active tasks to cancel")
                return

            tasks = list(self._active_tasks.values())
            printer.info(f"Cancelling {len(tasks)} active tasks with {timeout:.1f}s timeout")

            for task in tasks:
                if not task.done():
                    task.cancel()

            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=timeout,
                )
            except TimeoutError:
                remaining = sum(1 for t in tasks if not t.done())
                printer.warning(f"Timeout waiting for tasks to cancel, {remaining} remaining")

            self._active_tasks.clear()

    def get_active_count(self) -> int:
        return len(self._active_tasks)

    async def _process_message(self, incoming: IncomingMessage) -> None:
        chat_id = incoming.chat_id

        try:
            identity = self._user_identity.resolve(incoming)

            self._user_client_manager.set_chat_context(identity.user_id, chat_id)
            ai_client = await self._user_client_manager.get_or_create(identity.user_id)

            result = await self._streaming.deliver(
                chat_id=chat_id,
                ai_client=ai_client,
                prompt=incoming.text or "",
                conversation_id=identity.conversation_id,
            )

            if result.error:
                printer.error(f"Delivery failed for message {incoming.message_id}: {result.error}")
                await self._send_error_message(incoming, result.error)
                return

            if result.conversation_id and result.conversation_id != identity.conversation_id:
                self._user_identity.set_conversation_id(identity.user_id, result.conversation_id)

            printer.info(f"Message sent for {incoming.message_id} (conv: {result.conversation_id})")

        except asyncio.CancelledError:
            printer.info(f"Processing cancelled for chat {chat_id}")
            raise

        except Exception as e:
            printer.error(f"Error processing message {incoming.message_id} from chat {chat_id}: {e}")

            try:
                await self._send_error_message(incoming, str(e))
            except Exception as inner_e:
                printer.error(f"Failed to send error message to chat {chat_id}: {inner_e}")

    async def _answer_consent(self, incoming: IncomingMessage) -> bool:
        """True when the message answered a consent prompt its sender has open in this chat, which uses it up.

        Anything that is not a yes or yes-all counts as a denial.
        """
        chat_id = incoming.chat_id
        user_id = self._user_identity.get_user_id_for_sender(incoming.sender_id)
        if user_id is None or not self._consent.has_pending(chat_id, user_id):
            return False

        text = (incoming.text or "").strip().lower()
        response = parse_consent_reply(text) or "no"
        printer.info(f"Consent reply from {chat_id}: {text!r} -> {response}")
        if not self._consent.resolve(chat_id, user_id, response):
            # The prompt timed out just now, so this is an ordinary message after all.
            return False

        try:
            await self._transport.send_message(
                chat_id=chat_id,
                text=CONSENT_CONFIRMATIONS[response],
                reply_to_message_id=incoming.message_id,
            )
        except Exception:
            printer.warning(f"Failed to send consent confirmation to {chat_id}")
        return True

    def _cleanup_callback(self, chat_id: str, task: asyncio.Task) -> None:
        if task.cancelled():
            printer.info(f"Task for chat {chat_id} was cancelled")
        elif task.exception():
            printer.error(f"Task for chat {chat_id} failed: {task.exception()}")
        else:
            printer.info(f"Task for chat {chat_id} completed")

        async def _remove():
            async with self._lock:
                self._active_tasks.pop(chat_id, None)

        asyncio.create_task(_remove(), name=f"cleanup-{chat_id}")

    async def _send_busy_hint(self, incoming: IncomingMessage) -> None:
        try:
            await self._transport.send_message(
                chat_id=incoming.chat_id,
                text=self._config.busy_message,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            printer.warning(f"Failed to send busy hint to chat {incoming.chat_id}: {e}")

    async def _send_error_message(self, incoming: IncomingMessage, error: str | Exception) -> None:
        try:
            text = self._config.error_message
            if isinstance(error, asyncio.CancelledError):
                text = "Processing was interrupted. Please try again."

            await self._transport.send_message(
                chat_id=incoming.chat_id,
                text=text,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            printer.error(f"Failed to send error message to chat {incoming.chat_id}: {e}")
