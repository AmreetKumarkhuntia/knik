"""BotMessageHandler - Non-blocking message processor with per-chat task isolation.

This is the core orchestrator for the Bot App. It receives incoming messages
from any platform adapter and coordinates the full response lifecycle.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient
    from lib.services.messaging_client.client import MessagingClient
    from lib.services.messaging_client.models import IncomingMessage

    from .config import BotConfig
    from .streaming import StreamingResponseManager
    from .user_identity import UserIdentityManager

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ChatKey:
    """Immutable identifier for a unique chat across all platforms."""

    provider: str
    chat_id: str

    def __str__(self) -> str:
        return f"{self.provider}:{self.chat_id}"


@dataclass
class ActiveTaskInfo:
    """Metadata about an active processing task."""

    task: asyncio.Task
    started_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    message_id: str = ""
    user_hint: str = ""


class BotMessageHandler:
    """Non-blocking message processor with per-chat task isolation.

    Key design:
    - handle() returns immediately (fire-and-forget)
    - Each message spawns an asyncio.Task
    - Per-chat guard: only one task per chat_id at a time
    - Error isolation: one user's failure doesn't affect others

    Thread Safety:
    - All state mutations protected by _lock
    - Callbacks run in event loop context
    """

    def __init__(
        self,
        ai_client: AIClient,
        messaging_client: MessagingClient,
        user_identity: UserIdentityManager,
        streaming_manager: StreamingResponseManager,
        config: BotConfig,
    ) -> None:
        self._ai_client = ai_client
        self._messaging_client = messaging_client
        self._user_identity = user_identity
        self._streaming = streaming_manager
        self._config = config

        self._active_tasks: dict[ChatKey, ActiveTaskInfo] = {}
        self._lock = asyncio.Lock()

        self._total_processed = 0
        self._total_errors = 0
        self._total_queued = 0

    async def handle(self, incoming: IncomingMessage) -> None:
        """Non-blocking entry point. Returns immediately.

        Flow:
            1. Acquire lock and check for existing task
            2. If task exists: send "busy" hint, increment queue counter, return
            3. Create asyncio.Task for _process_message
            4. Register task in _active_tasks
            5. Add done_callback for cleanup
            6. Release lock and return
        """
        provider = incoming.provider_name or "unknown"
        chat_key = ChatKey(provider=provider, chat_id=incoming.chat_id)

        async with self._lock:
            if chat_key in self._active_tasks:
                self._total_queued += 1
                logger.debug("Chat %s already has active task, sending busy hint", chat_key)
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

            logger.info(
                "Started processing task for %s (message: %s)",
                chat_key,
                incoming.message_id,
            )

    async def cancel_all(self, timeout: float = 5.0) -> None:
        """Cancel all active tasks. Called during shutdown."""
        async with self._lock:
            if not self._active_tasks:
                logger.info("No active tasks to cancel")
                return

            tasks_info = list(self._active_tasks.items())
            logger.info(
                "Cancelling %d active tasks with %.1fs timeout",
                len(tasks_info),
                timeout,
            )

            for chat_key, info in tasks_info:
                if not info.task.done():
                    info.task.cancel()
                    logger.debug("Cancelled task for %s", chat_key)

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
        """Return number of active tasks for monitoring."""
        return len(self._active_tasks)

    def get_metrics(self) -> dict:
        """Return handler metrics for monitoring/health checks."""
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
        """Full message processing lifecycle. Runs as independent asyncio task."""
        chat_key = ChatKey(provider=provider, chat_id=incoming.chat_id)

        try:
            logger.debug(
                "Processing message %s from %s",
                incoming.message_id,
                chat_key,
            )

            identity = self._user_identity.resolve(incoming, provider)
            logger.debug(
                "Resolved user %s for sender %s",
                identity.user_id,
                incoming.sender_id,
            )

            result = await self._streaming.deliver(
                provider=provider,
                chat_id=incoming.chat_id,
                ai_client=self._ai_client,
                prompt=incoming.text or "",
                conversation_id=identity.conversation_id,
                provider_meta={},
            )

            if result.error:
                self._total_errors += 1
                logger.error(
                    "Delivery failed for message %s: %s",
                    incoming.message_id,
                    result.error,
                )
                await self._send_error_message(incoming, provider, Exception(result.error))
                return

            if result.conversation_id and result.conversation_id != identity.conversation_id:
                self._user_identity.set_conversation_id(identity.user_id, result.conversation_id)
                logger.debug(
                    "Updated conversation %s for user %s",
                    result.conversation_id,
                    identity.user_id,
                )

            self._total_processed += 1
            logger.info(
                "Successfully processed message %s (conv: %s)",
                incoming.message_id,
                result.conversation_id,
            )

        except asyncio.CancelledError:
            logger.info("Processing cancelled for %s", chat_key)
            raise

        except Exception as e:
            self._total_errors += 1
            logger.exception(
                "Error processing message %s from %s: %s",
                incoming.message_id,
                chat_key,
                e,
            )

            try:
                await self._send_error_message(incoming, provider, e)
            except Exception as inner_e:
                logger.error(
                    "Failed to send error message to %s: %s",
                    chat_key,
                    inner_e,
                )

    def _cleanup_callback(self, chat_key: ChatKey, task: asyncio.Task) -> None:
        """Done callback. Removes task from _active_tasks, logs any errors."""
        if task.cancelled():
            logger.info("Task for %s was cancelled", chat_key)
        elif task.exception():
            exc = task.exception()
            logger.error(
                "Task for %s failed with exception: %s",
                chat_key,
                exc,
            )
        else:
            logger.debug("Task for %s completed successfully", chat_key)

        asyncio.create_task(
            self._remove_active_task(chat_key),
            name=f"cleanup-{chat_key}",
        )

    async def _remove_active_task(self, chat_key: ChatKey) -> None:
        """Remove a task from _active_tasks. Called by cleanup callback."""
        async with self._lock:
            if chat_key in self._active_tasks:
                del self._active_tasks[chat_key]
                logger.debug("Removed task for %s from active tasks", chat_key)

    async def _send_busy_hint(self, incoming: IncomingMessage, provider: str) -> None:
        """Send a "still thinking" message when chat already has active task."""
        try:
            await self._messaging_client.send_message(
                chat_id=incoming.chat_id,
                text=self._config.busy_message,
                provider=provider,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            logger.warning(
                "Failed to send busy hint to %s:%s: %s",
                provider,
                incoming.chat_id,
                e,
            )

    async def _send_error_message(
        self,
        incoming: IncomingMessage,
        provider: str,
        error: Exception,
    ) -> None:
        """Send a user-friendly error message."""
        try:
            if isinstance(error, asyncio.CancelledError):
                text = "Processing was interrupted. Please try again."
            elif hasattr(error, "is_retryable") and error.is_retryable:
                text = f"{self._config.error_message} Please try again in a moment."
            else:
                text = self._config.error_message

            await self._messaging_client.send_message(
                chat_id=incoming.chat_id,
                text=text,
                provider=provider,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            logger.error(
                "Failed to send error message to %s:%s: %s",
                provider,
                incoming.chat_id,
                e,
            )
