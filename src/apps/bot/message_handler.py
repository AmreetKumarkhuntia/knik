"""BotMessageHandler - Non-blocking message processor with per-chat task isolation."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from lib.commands.service import CommandService
    from lib.services.messaging_client.client import MessagingClient
    from lib.services.messaging_client.models import IncomingMessage

    from .commands.registry import BotCommandDispatcher
    from .config import BotConfig
    from .streaming import StreamingResponseManager
    from .user_client_manager import UserClientManager
    from .user_identity import UserIdentityManager

logger = logging.getLogger(__name__)


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
        chat_key = ChatKey(provider=provider, chat_id=incoming.chat_id)

        logger.info("Received message: %s", incoming.text)

        if self._command_dispatcher and incoming.text and incoming.text.startswith("/"):
            try:
                result = await self._command_dispatcher.try_dispatch(incoming, self._user_identity)
                if result is not None:
                    identity = self._user_identity.resolve(incoming, provider)
                    if "ai_client" in result.data and self._user_client_manager is not None:
                        self._user_client_manager.set(identity.user_id, result.data["ai_client"])
                    # Clean up tool sessions (e.g. browser) when the user resets their session.
                    _cmd = incoming.text.split()[0].lstrip("/").split("@")[0].lower()
                    if _cmd in ("new", "start") and self._user_client_manager is not None:
                        self._user_client_manager.cleanup_tools(identity.user_id)
                    await self._messaging_client.send_message(
                        chat_id=incoming.chat_id,
                        text=result.message,
                        provider=provider,
                    )
                    return
            except Exception as e:
                logger.error("Command dispatch error: %s", e)

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

            logger.info("Started processing task for %s (message: %s)", chat_key, incoming.message_id)

    async def cancel_all(self, timeout: float = 5.0) -> None:
        async with self._lock:
            if not self._active_tasks:
                logger.info("No active tasks to cancel")
                return

            tasks_info = list(self._active_tasks.items())
            logger.info("Cancelling %d active tasks with %.1fs timeout", len(tasks_info), timeout)

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
                logger.warning(
                    "Timeout waiting for tasks to cancel, %d remaining",
                    sum(1 for t in tasks if not t.done()),
                )

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
                logger.error("Delivery failed for message %s: %s", incoming.message_id, result.error)
                await self._send_error_message(incoming, provider, result.error)
                return

            if result.conversation_id and result.conversation_id != identity.conversation_id:
                self._user_identity.set_conversation_id(identity.user_id, result.conversation_id)

            self._total_processed += 1
            logger.info("Message sent for %s (conv: %s)", incoming.message_id, result.conversation_id)

        except asyncio.CancelledError:
            logger.info("Processing cancelled for %s", chat_key)
            raise

        except Exception as e:
            self._total_errors += 1
            logger.exception("Error processing message %s from %s: %s", incoming.message_id, chat_key, e)

            try:
                await self._send_error_message(incoming, provider, str(e))
            except Exception as inner_e:
                logger.error("Failed to send error message to %s: %s", chat_key, inner_e)

    def _cleanup_callback(self, chat_key: ChatKey, task: asyncio.Task) -> None:
        if task.cancelled():
            logger.info("Task for %s was cancelled", chat_key)
        elif task.exception():
            logger.error("Task for %s failed: %s", chat_key, task.exception())
        else:
            logger.info("Task for %s completed", chat_key)

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
            logger.warning("Failed to send busy hint to %s:%s: %s", provider, incoming.chat_id, e)

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
            logger.error("Failed to send error message to %s:%s: %s", provider, incoming.chat_id, e)
