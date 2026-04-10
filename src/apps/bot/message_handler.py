"""BotMessageHandler - Non-blocking message processor with per-chat task isolation."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from imports import printer

from .consent import PendingConsents


if TYPE_CHECKING:
    from lib.commands.service import CommandService
    from lib.services.messaging_client.client import MessagingClient
    from lib.services.messaging_client.models import IncomingMessage

    from .commands.registry import BotCommandDispatcher
    from .config import BotConfig
    from .streaming import StreamingResponseManager
    from .user_client_manager import UserClientManager
    from .user_identity import UserIdentityManager


@dataclass(frozen=True)
class ChatKey:
    provider: str
    chat_id: str

    def __str__(self) -> str:
        return f"{self.provider}:{self.chat_id}"


@dataclass
class ActiveTaskInfo:
    task: asyncio.Task
    started_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    message_id: str = ""
    user_hint: str = ""


class BotMessageHandler:
    def __init__(
        self,
        command_service: CommandService,
        messaging_client: MessagingClient,
        user_identity: UserIdentityManager,
        streaming_manager: StreamingResponseManager,
        config: BotConfig,
        command_dispatcher: BotCommandDispatcher | None = None,
        user_client_manager: UserClientManager | None = None,
    ) -> None:
        self._command_service = command_service
        self._messaging_client = messaging_client
        self._user_identity = user_identity
        self._streaming = streaming_manager
        self._config = config
        self._command_dispatcher = command_dispatcher
        self._user_client_manager = user_client_manager

        self._active_tasks: dict[ChatKey, ActiveTaskInfo] = {}
        self._lock = asyncio.Lock()

        self._total_processed = 0
        self._total_errors = 0
        self._total_queued = 0

    async def handle(self, incoming: IncomingMessage) -> None:
        provider = incoming.provider_name or "unknown"

        if PendingConsents.has_pending(incoming.chat_id):
            text = (incoming.text or "").strip().lower()
            if text in ("yes all", "ya"):
                response = "yes_all"
            elif text in ("yes", "y"):
                response = "yes"
            else:
                response = "no"
            printer.info(f"Consent reply from {incoming.chat_id}: {text!r} -> {response}")
            PendingConsents.resolve(incoming.chat_id, response)
            confirm = {"yes": "Approved.", "yes_all": "Approved all.", "no": "Denied."}
            try:
                await self._messaging_client.send_message(
                    chat_id=incoming.chat_id,
                    text=confirm.get(response, "Denied."),
                    provider=provider,
                    reply_to_message_id=incoming.message_id,
                )
            except Exception:
                printer.warning(f"Failed to send consent confirmation to {incoming.chat_id}")
            return

        chat_key = ChatKey(provider=provider, chat_id=incoming.chat_id)

        printer.info(f"Received message: {incoming.text}")

        if self._command_dispatcher and incoming.text and incoming.text.startswith("/"):
            try:
                result = await self._command_dispatcher.try_dispatch(incoming, self._user_identity)
                if result is not None:
                    identity = self._user_identity.resolve(incoming, provider)
                    if self._user_client_manager is not None:
                        user_client = self._user_client_manager.get(identity.user_id)
                        if user_client:
                            if "new_model" in result.data:
                                user_client.set_model(result.data["new_model"])
                            if "new_provider" in result.data:
                                user_client.set_provider(result.data["new_provider"])
                    _cmd = incoming.text.split()[0].lstrip("/").split("@")[0].lower()
                    if _cmd in ("new", "start") and self._user_client_manager is not None:
                        self._user_client_manager.cleanup_tools(identity.user_id)
                    if result.data.get("revoke_consent") and self._user_client_manager is not None:
                        self._user_client_manager.revoke_tool_consent(identity.user_id)
                    await self._messaging_client.send_message(
                        chat_id=incoming.chat_id,
                        text=result.message,
                        provider=provider,
                    )
                    return
            except Exception as e:
                printer.error(f"Command dispatch error: {e}")

        async with self._lock:
            if chat_key in self._active_tasks:
                self._total_queued += 1
                asyncio.create_task(
                    self._send_busy_hint(incoming, provider),
                    name=f"busy-hint-{chat_key}",
                )
                return

            task = asyncio.create_task(
                self._process_message(incoming, provider),
                name=f"process-{chat_key}-{(incoming.message_id or 'unknown')[:8]}",
            )

            self._active_tasks[chat_key] = ActiveTaskInfo(
                task=task,
                message_id=incoming.message_id or "",
                user_hint=(incoming.text or "")[:50],
            )

            task.add_done_callback(lambda t: self._cleanup_callback(chat_key, t))

            printer.info(f"Started processing task for {chat_key} (message: {incoming.message_id})")

    async def cancel_all(self, timeout: float = 5.0) -> None:
        async with self._lock:
            if not self._active_tasks:
                printer.info("No active tasks to cancel")
                return

            tasks_info = list(self._active_tasks.items())
            printer.info(f"Cancelling {len(tasks_info)} active tasks with {timeout:.1f}s timeout")

            for _chat_key, info in tasks_info:
                if not info.task.done():
                    info.task.cancel()

            tasks = [info.task for _, info in tasks_info]
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

    def get_metrics(self) -> dict:
        return {
            "total_processed": self._total_processed,
            "total_errors": self._total_errors,
            "total_queued": self._total_queued,
            "active_count": len(self._active_tasks),
            "active_tasks": [
                {
                    "chat": str(chat_key),
                    "message_id": info.message_id,
                    "started_at": info.started_at.isoformat(),
                    "duration_seconds": (datetime.now(UTC) - info.started_at).total_seconds(),
                    "hint": info.user_hint,
                }
                for chat_key, info in self._active_tasks.items()
            ],
        }

    async def _process_message(self, incoming: IncomingMessage, provider: str) -> None:
        chat_key = ChatKey(provider=provider, chat_id=incoming.chat_id)

        try:
            identity = self._user_identity.resolve(incoming, provider)

            if self._user_client_manager is not None:
                self._user_client_manager.set_chat_context(identity.user_id, incoming.chat_id, provider)
                ai_client = await self._user_client_manager.get_or_create(identity.user_id)
            else:
                ai_client = self._command_service.ai_client

            result = await self._streaming.deliver(
                provider=provider,
                chat_id=incoming.chat_id,
                ai_client=ai_client,
                prompt=incoming.text or "",
                conversation_id=identity.conversation_id,
                provider_meta={},
            )

            if result.error:
                self._total_errors += 1
                printer.error(f"Delivery failed for message {incoming.message_id}: {result.error}")
                await self._send_error_message(incoming, provider, result.error)
                return

            if result.conversation_id and result.conversation_id != identity.conversation_id:
                self._user_identity.set_conversation_id(identity.user_id, result.conversation_id)

            self._total_processed += 1
            printer.info(f"Message sent for {incoming.message_id} (conv: {result.conversation_id})")

        except asyncio.CancelledError:
            printer.info(f"Processing cancelled for {chat_key}")
            raise

        except Exception as e:
            self._total_errors += 1
            printer.error(f"Error processing message {incoming.message_id} from {chat_key}: {e}")

            try:
                await self._send_error_message(incoming, provider, str(e))
            except Exception as inner_e:
                printer.error(f"Failed to send error message to {chat_key}: {inner_e}")

    def _cleanup_callback(self, chat_key: ChatKey, task: asyncio.Task) -> None:
        if task.cancelled():
            printer.info(f"Task for {chat_key} was cancelled")
        elif task.exception():
            printer.error(f"Task for {chat_key} failed: {task.exception()}")
        else:
            printer.info(f"Task for {chat_key} completed")

        async def _remove():
            async with self._lock:
                self._active_tasks.pop(chat_key, None)

        asyncio.create_task(_remove(), name=f"cleanup-{chat_key}")

    async def _send_busy_hint(self, incoming: IncomingMessage, provider: str) -> None:
        try:
            await self._messaging_client.send_message(
                chat_id=incoming.chat_id,
                text=self._config.busy_message,
                provider=provider,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            printer.warning(f"Failed to send busy hint to {provider}:{incoming.chat_id}: {e}")

    async def _send_error_message(
        self,
        incoming: IncomingMessage,
        provider: str,
        error: str | Exception,
    ) -> None:
        try:
            text = self._config.error_message
            if isinstance(error, asyncio.CancelledError):
                text = "Processing was interrupted. Please try again."

            await self._messaging_client.send_message(
                chat_id=incoming.chat_id,
                text=text,
                provider=provider,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            printer.error(f"Failed to send error message to {provider}:{incoming.chat_id}: {e}")
