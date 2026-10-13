"""BotMessageHandler - Non-blocking message processor with per-chat task isolation."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

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
    """Replies to each chat one message at a time; every message gets an answer of some kind.

    A consent answer or a command is handled at once, even while the chat's reply is streaming: the reply may be
    waiting on that consent answer, and a command only changes what the sender's next message gets (the reply
    keeps the provider it started with, and a /new or /resume made meanwhile is kept when it lands). Any other
    message that arrives while the chat's reply is in flight gets `busy_message` and does not reach the AI.
    At most `bot_concurrent_limit` replies run at a time across all chats; the rest wait for a slot.
    """

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
        # A limit below 1 would leave every reply waiting forever.
        self._reply_slots = asyncio.Semaphore(max(1, config.bot_concurrent_limit))

    async def handle(self, incoming: IncomingMessage) -> None:
        chat_id = incoming.chat_id

        if await self._answer_consent(incoming):
            return

        printer.info(f"Received message: {incoming.text}")

        if await self._run_command(incoming):
            return

        async with self._lock:
            busy = chat_id in self._active_tasks
            if not busy:
                task = asyncio.create_task(
                    self._process_message(incoming),
                    name=f"process-{chat_id}-{(incoming.message_id or 'unknown')[:8]}",
                )
                self._active_tasks[chat_id] = task
                task.add_done_callback(lambda t: self._cleanup_callback(chat_id, t))
                printer.info(f"Started processing task for chat {chat_id} (message: {incoming.message_id})")

        if busy:
            printer.info(f"Chat {chat_id} is busy; message {incoming.message_id} was not sent to the AI")
            await self._send(chat_id, self._config.busy_message, "busy reply", reply_to_message_id=incoming.message_id)

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

    async def _run_command(self, incoming: IncomingMessage) -> bool:
        """True when the message was a command, which has then been answered."""
        if self._command_dispatcher is None or not (incoming.text or "").startswith("/"):
            return False

        try:
            result = await self._command_dispatcher.try_dispatch(incoming, self._user_identity)
        except Exception as e:
            printer.error(f"Command dispatch failed for message {incoming.message_id} in chat {incoming.chat_id}: {e}")
            await self._send_error_message(incoming)
            return True

        if result is None:
            return False
        await self._send(incoming.chat_id, result.message, "command reply")
        return True

    async def _process_message(self, incoming: IncomingMessage) -> None:
        chat_id = incoming.chat_id

        try:
            identity = self._user_identity.resolve(incoming)
            session_version = self._user_identity.session_version(identity.user_id)

            self._user_client_manager.set_chat_context(identity.user_id, chat_id)
            async with self._reply_slots:
                ai_client = await self._user_client_manager.get_or_create(identity.user_id)

                result = await self._streaming.deliver(
                    chat_id=chat_id,
                    ai_client=ai_client,
                    prompt=incoming.text or "",
                    conversation_id=identity.conversation_id,
                )

            if result.error:
                printer.error(f"Delivery failed for message {incoming.message_id}: {result.error}")
                await self._send_error_message(incoming)
                return

            # Follow the conversation the reply was saved to, unless a /new or /resume during the reply moved the
            # user on; their choice wins over the reply's.
            moved = self._user_identity.session_version(identity.user_id) != session_version
            if result.conversation_id and result.conversation_id != identity.conversation_id and not moved:
                self._user_identity.set_conversation_id(identity.user_id, result.conversation_id)

            if not result.delivered:
                printer.warning(
                    f"Reply to message {incoming.message_id} in chat {chat_id} was not fully delivered: "
                    f"{'; '.join(result.send_errors)}"
                )
                await self._send_error_message(incoming)
                return

            printer.info(f"Message sent for {incoming.message_id} (conv: {result.conversation_id})")

        except asyncio.CancelledError:
            printer.info(f"Processing cancelled for chat {chat_id}")
            raise

        except Exception as e:
            printer.error(f"Error processing message {incoming.message_id} from chat {chat_id}: {e}")
            await self._send_error_message(incoming)

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

        await self._send(
            chat_id, CONSENT_CONFIRMATIONS[response], "consent confirmation", reply_to_message_id=incoming.message_id
        )
        return True

    def _cleanup_callback(self, chat_id: str, task: asyncio.Task) -> None:
        if task.cancelled():
            printer.info(f"Task for chat {chat_id} was cancelled")
        elif task.exception():
            printer.error(f"Task for chat {chat_id} failed: {task.exception()}")
        else:
            printer.info(f"Task for chat {chat_id} completed")

        # Freed here rather than in a later task, so the chat's next message is not turned away as busy.
        if self._active_tasks.get(chat_id) is task:
            del self._active_tasks[chat_id]

    async def _send_error_message(self, incoming: IncomingMessage) -> None:
        await self._send(
            incoming.chat_id, self._config.error_message, "error message", reply_to_message_id=incoming.message_id
        )

    async def _send(self, chat_id: str, text: str, what: str, **kwargs: Any) -> None:
        """Sends a message, logging rather than raising when the transport fails or reports a failed send."""
        try:
            result = await self._transport.send_message(chat_id=chat_id, text=text, **kwargs)
        except Exception as e:
            printer.warning(f"Failed to send the {what} to chat {chat_id}: {e}")
            return
        if not result.success:
            printer.warning(f"Failed to send the {what} to chat {chat_id}: {result.error}")
