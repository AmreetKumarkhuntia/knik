# Phase 4: BotMessageHandler - Core Message Orchestrator

**Status:** Planning
**Last Updated:** March 2026
**Depends On:** Phase 1 (IncomingMessage), Phase 2 (BotConfig, UserIdentityManager), Phase 3 (StreamingResponseManager)

---

## 1. Purpose & Scope

### Goal

Create the `BotMessageHandler` — the central orchestrator that processes incoming messages from any messaging platform. This component is the heart of the Bot App, coordinating between:

- **MessagingClient** — Platform-specific message delivery
- **AIClient** — LLM inference with conversation management
- **UserIdentityManager** — Cross-platform user identity resolution
- **StreamingResponseManager** — Real-time response streaming

### Key Design Principles

1. **Non-blocking**: `handle()` returns immediately; processing happens in background tasks
2. **Per-chat isolation**: Each chat has at most one active task; concurrent messages queue implicitly
3. **Error isolation**: One user's failure never affects another's processing
4. **Graceful shutdown**: All active tasks complete or cancel cleanly

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Message processing orchestration | Platform-specific adapters (Phase 5+) |
| Task lifecycle management | LLM inference logic (AIClient) |
| Per-chat concurrency guard | Streaming implementation (Phase 3) |
| Conversation mapping | User identity resolution (Phase 2) |
| Error handling & recovery | Database operations |

---

## 2. Class Design

### File Location

```
src/apps/bot/message_handler.py
```

### Full Implementation

```python
"""
BotMessageHandler - Non-blocking message processor with per-chat task isolation.

This is the core orchestrator for the Bot App. It receives incoming messages
from any platform adapter and coordinates the full response lifecycle.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.apps.bot.config import BotConfig
    from src.apps.bot.identity import UserIdentityManager
    from src.apps.bot.streaming import StreamingResponseManager
    from src.lib.services.ai_client.client import AIClient
    from src.lib.services.messaging.base import (
        IncomingMessage,
        MessagingClient,
    )

logger = logging.getLogger(__name__)


@dataclass
class ChatKey:
    """
    Immutable identifier for a unique chat across all platforms.

    Used as dict key for _active_tasks and _chat_map.
    """
    provider: str
    chat_id: str

    def __hash__(self) -> int:
        return hash((self.provider, self.chat_id))

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ChatKey):
            return NotImplemented
        return self.provider == other.provider and self.chat_id == other.chat_id

    def __str__(self) -> str:
        return f"{self.provider}:{self.chat_id}"


@dataclass
class ActiveTaskInfo:
    """
    Metadata about an active processing task.
    """
    task: asyncio.Task
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    message_id: str = ""
    user_hint: str = ""  # Brief description for debugging


class BotMessageHandler:
    """
    Non-blocking message processor with per-chat task isolation.

    Key design:
    - handle() returns immediately (fire-and-forget)
    - Each message spawns an asyncio.Task
    - Per-chat guard: only one task per chat_id at a time
    - Error isolation: one user's failure doesn't affect others

    Thread Safety:
    - All state mutations protected by _lock
    - Callbacks run in event loop context

    Usage:
        handler = BotMessageHandler(ai_client, messaging, identity, streaming, config)

        # Called by platform adapters when messages arrive
        await handler.handle(incoming_message)  # Returns immediately

        # During shutdown
        await handler.cancel_all()
    """

    def __init__(
        self,
        ai_client: AIClient,
        messaging_client: MessagingClient,
        user_identity: UserIdentityManager,
        streaming_manager: StreamingResponseManager,
        config: BotConfig,
    ) -> None:
        """
        Initialize the message handler.

        Args:
            ai_client: LLM client for generating responses
            messaging_client: Platform-agnostic messaging interface
            user_identity: Cross-platform user identity resolver
            streaming_manager: Real-time response delivery
            config: Bot configuration
        """
        self._ai_client = ai_client
        self._messaging_client = messaging_client
        self._user_identity = user_identity
        self._streaming = streaming_manager
        self._config = config

        # Per-chat state - all protected by _lock
        self._chat_map: dict[ChatKey, str] = {}  # chat_key -> conversation_id
        self._active_tasks: dict[ChatKey, ActiveTaskInfo] = {}  # chat_key -> task info
        self._lock = asyncio.Lock()

        # Metrics for monitoring
        self._total_processed = 0
        self._total_errors = 0
        self._total_queued = 0  # Messages received while chat was busy

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    async def handle(self, incoming: IncomingMessage) -> None:
        """
        Non-blocking entry point. Returns immediately.

        This is the main entry point called by platform adapters when a new
        message arrives. It performs minimal synchronous work and spawns a
        background task for actual processing.

        Flow:
            1. Acquire lock and check for existing task
            2. If task exists: send "busy" hint, increment queue counter, return
            3. Create asyncio.Task for _process_message
            4. Register task in _active_tasks
            5. Add done_callback for cleanup
            6. Release lock and return

        Args:
            incoming: The incoming message from any platform

        Note:
            This method MUST return quickly (< 10ms typically) to avoid
            blocking the platform adapter's webhook handler.
        """
        chat_key = ChatKey(
            provider=incoming.provider_name,
            chat_id=incoming.chat_id,
        )

        async with self._lock:
            # Check for existing task for this chat
            if chat_key in self._active_tasks:
                self._total_queued += 1
                logger.debug(
                    "Chat %s already has active task, sending busy hint",
                    chat_key,
                )
                # Fire-and-forget the busy response
                asyncio.create_task(
                    self._send_busy_hint(incoming),
                    name=f"busy-hint-{chat_key}",
                )
                return

            # Create the processing task
            task = asyncio.create_task(
                self._process_message(incoming),
                name=f"process-{chat_key}-{incoming.message_id[:8]}",
            )

            # Register active task
            self._active_tasks[chat_key] = ActiveTaskInfo(
                task=task,
                message_id=incoming.message_id,
                user_hint=incoming.text[:50] if incoming.text else "",
            )

            # Setup cleanup callback
            # Note: callback runs in event loop, receives the completed task
            task.add_done_callback(
                lambda t: self._cleanup_callback(chat_key, t)
            )

            logger.info(
                "Started processing task for %s (message: %s)",
                chat_key,
                incoming.message_id,
            )

    async def cancel_all(self, timeout: float = 5.0) -> None:
        """
        Cancel all active tasks. Called during shutdown.

        This method attempts graceful cancellation with a timeout. Tasks
        that don't complete within the timeout are forcefully cancelled.

        Args:
            timeout: Maximum seconds to wait for tasks to complete

        Usage:
            # In BotApp.shutdown()
            await handler.cancel_all(timeout=10.0)
        """
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

            # Cancel all tasks
            for chat_key, info in tasks_info:
                if not info.task.done():
                    info.task.cancel()
                    logger.debug("Cancelled task for %s", chat_key)

            # Wait for completion with timeout
            tasks = [info.task for _, info in tasks_info]
            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=timeout,
                )
            except asyncio.TimeoutError:
                logger.warning(
                    "Timeout waiting for tasks to cancel, %d remaining",
                    sum(1 for t in tasks if not t.done()),
                )

            # Clear state
            self._active_tasks.clear()

    def get_active_count(self) -> int:
        """
        Return number of active tasks for monitoring.

        Thread-safe: only reads the dict length, no lock needed.
        """
        return len(self._active_tasks)

    def get_metrics(self) -> dict:
        """
        Return handler metrics for monitoring/health checks.

        Returns:
            Dict with processed count, error count, queued count,
            active task count, and active task details.
        """
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
                    "duration_seconds": (
                        datetime.now(timezone.utc) - info.started_at
                    ).total_seconds(),
                    "hint": info.user_hint,
                }
                for chat_key, info in self._active_tasks.items()
            ],
        }

    # -------------------------------------------------------------------------
    # Internal Processing
    # -------------------------------------------------------------------------

    async def _process_message(self, incoming: IncomingMessage) -> None:
        """
        Full message processing lifecycle. Runs as independent asyncio task.

        This method contains the complete business logic for handling a message:

        1. Resolve user_id via UserIdentityManager
        2. Lookup/create conversation_id for this chat
        3. Call StreamingResponseManager.deliver() to generate and stream
        4. Store conversation_id mapping if this was a new conversation
        5. Handle errors -> send user-friendly error message

        Error Handling:
            All exceptions are caught and result in a user-friendly error
            message. Exceptions never propagate to the event loop.

        Args:
            incoming: The incoming message to process
        """
        chat_key = ChatKey(
            provider=incoming.provider_name,
            chat_id=incoming.chat_id,
        )

        try:
            logger.debug(
                "Processing message %s from %s",
                incoming.message_id,
                chat_key,
            )

            # Step 1: Resolve user identity
            user_id = await self._user_identity.resolve(
                provider=incoming.provider_name,
                platform_user_id=incoming.user_id,
                user_name=incoming.user_name,
            )
            logger.debug(
                "Resolved user %s for platform user %s",
                user_id,
                incoming.user_id,
            )

            # Step 2: Get or create conversation
            conversation_id = await self._get_or_create_conversation(
                chat_key=chat_key,
                user_id=user_id,
            )

            # Step 3: Generate and deliver response via streaming manager
            await self._streaming.deliver(
                incoming=incoming,
                conversation_id=conversation_id,
                user_id=user_id,
                ai_client=self._ai_client,
                messaging_client=self._messaging_client,
            )

            # Success!
            self._total_processed += 1
            logger.info(
                "Successfully processed message %s (conv: %s)",
                incoming.message_id,
                conversation_id,
            )

        except asyncio.CancelledError:
            # Task was cancelled (likely during shutdown)
            logger.info("Processing cancelled for %s", chat_key)
            raise  # Re-raise to properly mark task as cancelled

        except Exception as e:
            # Catch-all for error isolation
            self._total_errors += 1
            logger.exception(
                "Error processing message %s from %s: %s",
                incoming.message_id,
                chat_key,
                e,
            )

            # Send user-friendly error message
            try:
                await self._send_error_message(incoming, e)
            except Exception as inner_e:
                # Last resort - log but don't raise
                logger.error(
                    "Failed to send error message to %s: %s",
                    chat_key,
                    inner_e,
                )

    async def _get_or_create_conversation(
        self,
        chat_key: ChatKey,
        user_id: str,
    ) -> str:
        """
        Get existing conversation ID or create a new one.

        Conversation mapping strategy:
        1. Check _chat_map for existing (provider, chat_id) -> conv_id
        2. If not found, check if user has an existing active conversation
        3. If user has existing conv, create new chat mapping to that conv
        4. Otherwise, create entirely new conversation

        This allows:
        - Same user on different platforms to continue their conversation
        - Different users in same chat (group chats) to share a conversation

        Args:
            chat_key: The platform chat identifier
            user_id: The resolved user identity

        Returns:
            The conversation UUID
        """
        # Check local cache first
        if chat_key in self._chat_map:
            return self._chat_map[chat_key]

        # Check if this chat already has a conversation in DB
        # (handles restart scenarios where _chat_map is empty)
        existing_conv = await self._ai_client.get_conversation_for_chat(
            provider=chat_key.provider,
            chat_id=chat_key.chat_id,
        )

        if existing_conv:
            async with self._lock:
                self._chat_map[chat_key] = existing_conv
            return existing_conv

        # Create new conversation
        conversation_id = await self._ai_client.create_conversation(
            user_id=user_id,
            metadata={
                "provider": chat_key.provider,
                "chat_id": chat_key.chat_id,
                "created_via": "bot",
            },
        )

        # Store mapping
        async with self._lock:
            self._chat_map[chat_key] = conversation_id

        logger.debug(
            "Created new conversation %s for %s (user: %s)",
            conversation_id,
            chat_key,
            user_id,
        )

        return conversation_id

    # -------------------------------------------------------------------------
    # Callbacks & Cleanup
    # -------------------------------------------------------------------------

    def _cleanup_callback(self, chat_key: ChatKey, task: asyncio.Task) -> None:
        """
        Done callback. Removes task from _active_tasks, logs any errors.

        IMPORTANT: This runs in the event loop context but is NOT an async
        function. It cannot await coroutines directly. For async cleanup,
        schedule a coroutine with asyncio.create_task().

        Args:
            chat_key: The chat identifier
            task: The completed (or failed, or cancelled) task
        """
        # Check task result
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

        # Remove from active tasks
        # We must schedule this since we can't await in a callback
        asyncio.create_task(
            self._remove_active_task(chat_key),
            name=f"cleanup-{chat_key}",
        )

    async def _remove_active_task(self, chat_key: ChatKey) -> None:
        """
        Remove a task from _active_tasks. Called by cleanup callback.
        """
        async with self._lock:
            if chat_key in self._active_tasks:
                del self._active_tasks[chat_key]
                logger.debug("Removed task for %s from active tasks", chat_key)

    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------

    async def _send_busy_hint(self, incoming: IncomingMessage) -> None:
        """
        Send a "still thinking" message when chat already has active task.

        This provides user feedback when they send messages faster than
        the bot can respond.
        """
        try:
            await self._messaging_client.send_message(
                provider_name=incoming.provider_name,
                chat_id=incoming.chat_id,
                text=self._config.busy_message,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            logger.warning(
                "Failed to send busy hint to %s:%s: %s",
                incoming.provider_name,
                incoming.chat_id,
                e,
            )

    async def _send_error_message(
        self,
        incoming: IncomingMessage,
        error: Exception,
    ) -> None:
        """
        Send a user-friendly error message.

        The error message is configurable via BotConfig and should not
        expose internal details to the user.
        """
        try:
            # Determine error message based on error type
            if isinstance(error, asyncio.CancelledError):
                text = "Processing was interrupted. Please try again."
            elif hasattr(error, "is_retryable") and error.is_retryable:
                text = f"{self._config.error_message} Please try again in a moment."
            else:
                text = self._config.error_message

            await self._messaging_client.send_message(
                provider_name=incoming.provider_name,
                chat_id=incoming.chat_id,
                text=text,
                reply_to_message_id=incoming.message_id,
            )
        except Exception as e:
            logger.error(
                "Failed to send error message to %s:%s: %s",
                incoming.provider_name,
                incoming.chat_id,
                e,
            )

    async def update_chat_mapping(
        self,
        chat_key: ChatKey,
        conversation_id: str,
    ) -> None:
        """
        Update the chat-to-conversation mapping.

        Called when a conversation is created externally or migrated.
        """
        async with self._lock:
            self._chat_map[chat_key] = conversation_id
            logger.debug(
                "Updated chat mapping: %s -> %s",
                chat_key,
                conversation_id,
            )

    async def remove_chat_mapping(self, chat_key: ChatKey) -> None:
        """
        Remove a chat-to-conversation mapping.

        Called when a conversation is deleted or archived.
        """
        async with self._lock:
            if chat_key in self._chat_map:
                del self._chat_map[chat_key]
                logger.debug("Removed chat mapping for %s", chat_key)
```

---

## 3. Concurrency Model

### asyncio Tasks vs Threads

This implementation uses **asyncio tasks**, not threads. Key differences:

| Aspect | asyncio Tasks | Threads |
|--------|---------------|---------|
| Concurrency | Cooperative (single-threaded) | Preemptive (OS-managed) |
| Context Switch | At await points | Any time |
| Shared State | Safe with simple locks | Requires careful synchronization |
| Cancellation | Explicit, clean | Difficult, potentially unsafe |
| Debugging | Stack traces preserved | Harder to trace |

### Why asyncio Tasks?

1. **I/O-bound workload**: Message processing is dominated by I/O (API calls, DB queries)
2. **Clean cancellation**: Tasks can be cancelled mid-await without corruption
3. **Event loop integration**: Platform adapters likely use async web frameworks
4. **Memory efficient**: Thousands of tasks vs hundreds of threads

### Task Lifecycle

```
                         ┌─────────────────────┐
                         │   handle() called   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Acquire _lock       │
                         │ Check _active_tasks │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼───────┐               ┌───────▼───────┐
            │ Task exists   │               │ No task       │
            │ Send busy hint│               │ Create task   │
            │ Return        │               │ Register      │
            └───────────────┘               └───────┬───────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │ Release _lock     │
                                          │ Return to caller  │
                                          └─────────┬─────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │ Task runs async   │
                                          │ _process_message()│
                                          └─────────┬─────────┘
                                                    │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                      ┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐
                      │   Success     │     │   Exception   │     │   Cancelled   │
                      │ Log success   │     │ Log error     │     │ Log cancel    │
                      │ Increment     │     │ Send error    │     │ Re-raise      │
                      │ processed     │     │ message       │     │               │
                      └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
                              │                     │                     │
                              └─────────────────────┼─────────────────────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │ done_callback     │
                                          │ _cleanup_callback │
                                          │ Remove from map   │
                                          └───────────────────┘
```

### Lock Strategy

The `_lock` (asyncio.Lock) protects:

- `_active_tasks`: Task registration and removal
- `_chat_map`: Conversation ID mappings

**Critical Sections:**

```python
async with self._lock:
    # Check + register must be atomic
    if chat_key in self._active_tasks:
        # Handle busy case
        return
    self._active_tasks[chat_key] = task_info
```

**Non-Locked Operations:**

- `get_active_count()`: Dict length is atomic in Python
- `get_metrics()`: Reads may be slightly stale but acceptable for monitoring

### Race Condition Prevention

**Scenario:** Two messages arrive simultaneously for the same chat.

```
Timeline:
─────────────────────────────────────────────────────────────
T0: Message A arrives, handle() called
T1: Message B arrives, handle() called (while A is in handle())
T2: A acquires lock
T3: A checks _active_tasks (empty), creates task, registers
T4: A releases lock
T5: B acquires lock
T6: B checks _active_tasks (A's task exists), sends busy hint
T7: B releases lock
─────────────────────────────────────────────────────────────
Result: A processes, B gets busy hint. No race condition.
```

---

## 4. State Management

### _chat_map: Conversation Mapping

```python
self._chat_map: dict[ChatKey, str] = {}
# Example:
# {
#     ChatKey("telegram", "12345"): "conv-uuid-abc",
#     ChatKey("discord", "67890"): "conv-uuid-xyz",
# }
```

**Purpose:** Quick lookup of conversation ID for a specific platform chat.

**Lifecycle:**
1. Empty on startup
2. Populated on first message from each chat
3. May be pre-populated from DB on startup (optimization)
4. Cleared on shutdown (persisted in DB)

**Persistence:** The AIClient stores the mapping in the conversation metadata:
```json
{
  "provider": "telegram",
  "chat_id": "12345",
  "user_id": "user-uuid",
  "created_at": "2026-03-30T10:00:00Z"
}
```

### _active_tasks: Running Tasks

```python
self._active_tasks: dict[ChatKey, ActiveTaskInfo] = {}
# Example:
# {
#     ChatKey("telegram", "12345"): ActiveTaskInfo(
#         task=<Task>,
#         started_at=datetime(...),
#         message_id="msg-123",
#         user_hint="What's the weather...",
#     ),
# }
```

**Purpose:** Track in-flight processing for:
- Concurrency guard (prevent duplicate tasks)
- Monitoring (what's currently processing)
- Graceful shutdown (cancel all tasks)

**Lifecycle:**
1. Empty on startup
2. Task added when handle() creates task
3. Task removed by done_callback when complete
4. Cleared by cancel_all() during shutdown

### _lock: Async Lock

```python
self._lock = asyncio.Lock()
```

**Protects:** `_chat_map` and `_active_tasks`

**Usage Pattern:**
```python
async with self._lock:
    # Critical section - mutations here
    ...
# Lock automatically released
```

**Why asyncio.Lock?**
- Works with async code (can await while holding)
- Reentrant within same coroutine
- No OS overhead (userspace lock)

---

## 5. Message Processing Flow

### Sequence Diagram

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│Platform │     │BotMessage│     │UserIdent│     │AIClient  │     │Streaming│     │Messaging│
│Adapter  │     │Handler   │     │Manager  │     │          │     │Manager  │     │Client   │
└────┬────┘     └────┬─────┘     └────┬────┘     └────┬─────┘     └────┬────┘     └────┬────┘
     │               │                │               │                │               │
     │ handle(msg)   │                │               │                │               │
     │──────────────>│                │               │                │               │
     │               │                │               │                │               │
     │               │ [check active] │               │                │               │
     │               │──────┬────────>│               │                │               │
     │               │      │         │               │                │               │
     │               │<─────┘         │               │                │               │
     │               │                │               │                │               │
     │               │ [create task]  │               │                │               │
     │               │──────┬────────>│               │                │               │
     │               │      │         │               │                │               │
     │               │<─────┘         │               │                │               │
     │               │                │               │                │               │
     │ (returns)     │                │               │                │               │
     │<──────────────│                │               │                │               │
     │               │                │               │                │               │
     │               │ ═════════════════════════════════════════════════════════════
     │               │   ASYNC TASK: _process_message()
     │               │ ═════════════════════════════════════════════════════════════
     │               │                │               │                │               │
     │               │                │ resolve()    │                │               │
     │               │                │──────────────>│                │               │
     │               │                │               │                │               │
     │               │                │ user_id       │                │               │
     │               │                │<──────────────│                │               │
     │               │                │               │                │               │
     │               │ [lookup/create conv]          │                │               │
     │               │───────────────────────────────>│                │               │
     │               │                               │                │               │
     │               │ conversation_id               │                │               │
     │               │<───────────────────────────────│                │               │
     │               │                               │                │               │
     │               │                │               │                │ deliver()     │
     │               │                │               │                │──────────────>│
     │               │                │               │                │               │
     │               │                │               │                │   ┌───────────┴───┐
     │               │                │               │                │   │ Stream loop:  │
     │               │                │               │                │   │ 1. AI stream  │
     │               │                │               │                │   │ 2. Send chunk │
     │               │                │               │                │   │ 3. Repeat     │
     │               │                │               │                │   └───────────┬───┘
     │               │                │               │                │               │
     │               │                │               │                │ done          │
     │               │                │               │                │<──────────────│
     │               │                │               │                │               │
     │               │ [cleanup callback]            │                │               │
     │               │──────┬────────>│               │                │               │
     │               │<─────┘         │               │                │               │
     │               │                │               │                │               │
```

### Processing States

| State | Description | Next State |
|-------|-------------|------------|
| PENDING | Message received, task not yet created | PROCESSING |
| PROCESSING | Task running, message being handled | COMPLETED / FAILED / CANCELLED |
| COMPLETED | Successfully processed, response sent | (terminal) |
| FAILED | Exception occurred, error message sent | (terminal) |
| CANCELLED | Task cancelled during shutdown | (terminal) |
| BUSY | Another task active for this chat | (terminal, no task created) |

---

## 6. Error Handling Strategy

### Error Categories

| Category | Examples | User Message | Recovery |
|----------|----------|--------------|----------|
| **Transient** | API timeout, rate limit | "Please try again" | Auto-retry (future) |
| **Permanent** | Invalid API key, model not found | Generic error | Alert ops |
| **User Error** | Invalid input, blocked user | Context-specific | None needed |
| **System** | DB connection lost, OOM | Generic error | Alert ops |

### Exception Handling Layers

```python
# Layer 1: handle() - Never raises
async def handle(self, incoming: IncomingMessage) -> None:
    try:
        # All logic wrapped
    except Exception:
        logger.exception("Unexpected error in handle()")
        # Swallow - never propagate to caller

# Layer 2: _process_message() - Catches all, sends error message
async def _process_message(self, incoming: IncomingMessage) -> None:
    try:
        # Processing logic
    except asyncio.CancelledError:
        # Re-raise for proper task cancellation
        raise
    except Exception as e:
        self._total_errors += 1
        await self._send_error_message(incoming, e)

# Layer 3: _send_error_message() - Best effort, never raises
async def _send_error_message(self, incoming: IncomingMessage, error: Exception) -> None:
    try:
        await self._messaging_client.send_message(...)
    except Exception:
        logger.error("Failed to send error message")
        # Swallow - nothing more we can do
```

### Error Message Configuration

In `BotConfig`:

```python
@dataclass
class BotConfig:
    # ...
    error_message: str = (
        "Sorry, I encountered an error processing your message. "
        "Please try again later."
    )
    busy_message: str = (
        "I'm still thinking about your previous message. "
        "Please wait a moment."
    )
```

### Logging Strategy

```python
# DEBUG: Detailed flow
logger.debug("Started processing task for %s", chat_key)

# INFO: Important events
logger.info("Successfully processed message %s", message_id)

# WARNING: Recoverable issues
logger.warning("Failed to send busy hint: %s", e)

# ERROR: Failures requiring attention
logger.error("Task failed with exception: %s", e)

# EXCEPTION: Full stack trace
logger.exception("Unexpected error in handle()")
```

---

## 7. Shutdown Procedure

### Graceful Shutdown Sequence

```
BotApp.shutdown() called
        │
        ▼
┌───────────────────────┐
│ 1. Stop accepting     │
│    new messages       │
│    (close webhooks)   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 2. Call               │
│    handler.cancel_all()│
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 3. cancel_all()       │
│    - Cancels all      │
│      active tasks     │
│    - Waits for        │
│      completion       │
│    - Times out after  │
│      N seconds        │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 4. Cleanup callbacks  │
│    remove tasks from  │
│    _active_tasks      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ 5. Shutdown complete  │
│    _active_tasks = {} │
└───────────────────────┘
```

### cancel_all() Implementation

```python
async def cancel_all(self, timeout: float = 5.0) -> None:
    """
    Cancel all active tasks with timeout.

    Args:
        timeout: Maximum seconds to wait for graceful completion
    """
    async with self._lock:
        if not self._active_tasks:
            return

        # Cancel all tasks
        for chat_key, info in self._active_tasks.items():
            if not info.task.done():
                info.task.cancel()

        # Gather with return_exceptions to not raise on cancelled tasks
        tasks = [info.task for info in self._active_tasks.values()]

        try:
            await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            # Force remaining tasks to stop
            for task in tasks:
                if not task.done():
                    logger.warning("Force-cancelling task: %s", task.get_name())

        self._active_tasks.clear()
```

### Cancellation Propagation

When a task is cancelled:

1. `task.cancel()` is called
2. Current await point raises `asyncio.CancelledError`
3. Our code catches and re-raises in `_process_message()`
4. Task status becomes "cancelled"
5. `done_callback` fires
6. Task removed from `_active_tasks`

```python
async def _process_message(self, incoming: IncomingMessage) -> None:
    try:
        # ... processing ...
    except asyncio.CancelledError:
        logger.info("Processing cancelled")
        raise  # IMPORTANT: Re-raise for proper task state
```

---

## 8. Dependencies on Phases 1-3

### Phase 1: IncomingMessage

**Required from Phase 1:**

```python
@dataclass
class IncomingMessage:
    message_id: str
    chat_id: str
    user_id: str  # Platform-specific user ID
    user_name: str | None
    text: str
    provider_name: str  # "telegram", "discord", etc.
    timestamp: datetime
    reply_to_id: str | None
    metadata: dict
```

**Used in:**
- `handle()`: Entry point receives IncomingMessage
- `_process_message()`: All processing uses message fields
- `_send_busy_hint()`, `_send_error_message()`: Use provider_name, chat_id

**Extension needed:**
- `IncomingMessage.provider_name` must be set by platform adapters

### Phase 2: BotConfig & UserIdentityManager

**Required from Phase 2:**

```python
@dataclass
class BotConfig:
    error_message: str
    busy_message: str
    # ... other config

class UserIdentityManager:
    async def resolve(
        self,
        provider: str,
        platform_user_id: str,
        user_name: str | None,
    ) -> str:
        """Resolve platform user ID to internal user UUID."""
```

**Used in:**
- `__init__()`: Config injected
- `_process_message()`: User identity resolution
- `_send_busy_hint()`, `_send_error_message()`: Config messages

### Phase 3: StreamingResponseManager

**Required from Phase 3:**

```python
class StreamingResponseManager:
    async def deliver(
        self,
        incoming: IncomingMessage,
        conversation_id: str,
        user_id: str,
        ai_client: AIClient,
        messaging_client: MessagingClient,
    ) -> None:
        """Generate and stream response to user."""
```

**Used in:**
- `_process_message()`: Orchestrates streaming delivery

### AIClient Extensions

**Required methods on AIClient:**

```python
class AIClient:
    async def get_conversation_for_chat(
        self,
        provider: str,
        chat_id: str,
    ) -> str | None:
        """Get existing conversation ID for a platform chat."""

    async def create_conversation(
        self,
        user_id: str,
        metadata: dict,
    ) -> str:
        """Create new conversation with metadata."""
```

### MessagingClient Interface

**Required from messaging abstraction:**

```python
class MessagingClient(Protocol):
    async def send_message(
        self,
        provider_name: str,
        chat_id: str,
        text: str,
        reply_to_message_id: str | None = None,
    ) -> str:
        """Send a message. Returns sent message ID."""

    async def edit_message(
        self,
        provider_name: str,
        chat_id: str,
        message_id: str,
        text: str,
    ) -> None:
        """Edit an existing message."""
```

---

## 9. Testing Instructions

### Unit Tests

#### Test File Location

```
tests/apps/bot/test_message_handler.py
```

#### Test: Basic Message Processing

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.apps.bot.message_handler import BotMessageHandler, ChatKey

@pytest.fixture
def handler():
    return BotMessageHandler(
        ai_client=MagicMock(),
        messaging_client=MagicMock(),
        user_identity=MagicMock(),
        streaming_manager=MagicMock(),
        config=MagicMock(
            error_message="Error",
            busy_message="Busy",
        ),
    )

@pytest.fixture
def incoming_message():
    return MagicMock(
        message_id="msg-123",
        chat_id="chat-456",
        user_id="user-789",
        user_name="Test User",
        text="Hello",
        provider_name="telegram",
        timestamp=datetime.now(timezone.utc),
    )

@pytest.mark.asyncio
async def test_handle_returns_immediately(handler, incoming_message):
    """handle() should return before processing completes."""
    # Setup slow processing
    handler._user_identity.resolve = AsyncMock(return_value="user-uuid")
    handler._streaming.deliver = AsyncMock(side_effect=lambda **kw: asyncio.sleep(1))

    start = asyncio.get_event_loop().time()
    await handler.handle(incoming_message)
    elapsed = asyncio.get_event_loop().time() - start

    # Should return in < 100ms
    assert elapsed < 0.1
    assert handler.get_active_count() == 1

@pytest.mark.asyncio
async def test_busy_hint_sent_for_concurrent_messages(handler, incoming_message):
    """Second message to same chat should get busy hint."""
    handler._user_identity.resolve = AsyncMock(return_value="user-uuid")
    handler._streaming.deliver = AsyncMock(side_effect=lambda **kw: asyncio.sleep(1))
    handler._messaging_client.send_message = AsyncMock()

    # First message
    await handler.handle(incoming_message)

    # Second message (same chat)
    await handler.handle(incoming_message)

    # Should have sent busy hint
    assert handler._messaging_client.send_message.called
    call_args = handler._messaging_client.send_message.call_args
    assert call_args.kwargs["text"] == handler._config.busy_message

@pytest.mark.asyncio
async def test_different_chats_process_concurrently(handler):
    """Messages from different chats should process in parallel."""
    handler._user_identity.resolve = AsyncMock(return_value="user-uuid")

    processed = []
    async def track_delivery(**kw):
        processed.append(kw["incoming"].chat_id)
        await asyncio.sleep(0.1)

    handler._streaming.deliver = track_delivery

    msg1 = MagicMock(chat_id="chat-1", provider_name="telegram", message_id="m1")
    msg2 = MagicMock(chat_id="chat-2", provider_name="telegram", message_id="m2")

    await handler.handle(msg1)
    await handler.handle(msg2)

    # Wait for both to complete
    await asyncio.sleep(0.2)

    # Both should have processed
    assert len(processed) == 2
    assert "chat-1" in processed
    assert "chat-2" in processed

@pytest.mark.asyncio
async def test_error_sends_user_message(handler, incoming_message):
    """Exceptions should result in user-friendly error message."""
    handler._user_identity.resolve = AsyncMock(side_effect=Exception("Boom!"))
    handler._messaging_client.send_message = AsyncMock()

    await handler.handle(incoming_message)

    # Wait for processing
    await asyncio.sleep(0.1)

    # Should have sent error message
    assert handler._messaging_client.send_message.called
    call_args = handler._messaging_client.send_message.call_args
    assert call_args.kwargs["text"] == handler._config.error_message

@pytest.mark.asyncio
async def test_cancel_all_cancels_active_tasks(handler, incoming_message):
    """cancel_all() should cancel all active tasks."""
    handler._user_identity.resolve = AsyncMock(return_value="user-uuid")
    handler._streaming.deliver = AsyncMock(side_effect=lambda **kw: asyncio.sleep(10))

    await handler.handle(incoming_message)
    assert handler.get_active_count() == 1

    await handler.cancel_all(timeout=1.0)

    assert handler.get_active_count() == 0

@pytest.mark.asyncio
async def test_chat_key_hash_and_equality():
    """ChatKey should work as dict key."""
    key1 = ChatKey("telegram", "123")
    key2 = ChatKey("telegram", "123")
    key3 = ChatKey("telegram", "456")

    assert key1 == key2
    assert key1 != key3
    assert hash(key1) == hash(key2)

    d = {key1: "value"}
    assert d[key2] == "value"
```

### Integration Tests

#### Test: Full Flow with Mock Components

```python
@pytest.mark.asyncio
async def test_full_message_flow():
    """Test complete flow with mock components."""
    # Setup mocks
    ai_client = MagicMock()
    ai_client.get_conversation_for_chat = AsyncMock(return_value=None)
    ai_client.create_conversation = AsyncMock(return_value="conv-uuid")

    messaging_client = MagicMock()
    messaging_client.send_message = AsyncMock(return_value="sent-msg-id")

    user_identity = MagicMock()
    user_identity.resolve = AsyncMock(return_value="user-uuid")

    streaming_manager = MagicMock()
    streaming_manager.deliver = AsyncMock()

    config = MagicMock(
        error_message="Error occurred",
        busy_message="Still thinking",
    )

    # Create handler
    handler = BotMessageHandler(
        ai_client=ai_client,
        messaging_client=messaging_client,
        user_identity=user_identity,
        streaming_manager=streaming_manager,
        config=config,
    )

    # Create test message
    incoming = MagicMock(
        message_id="msg-123",
        chat_id="chat-456",
        user_id="platform-user-789",
        user_name="Test User",
        text="What is AI?",
        provider_name="telegram",
        timestamp=datetime.now(timezone.utc),
    )

    # Process
    await handler.handle(incoming)

    # Wait for completion
    await asyncio.sleep(0.1)

    # Verify flow
    user_identity.resolve.assert_called_once_with(
        provider="telegram",
        platform_user_id="platform-user-789",
        user_name="Test User",
    )

    ai_client.create_conversation.assert_called_once()
    streaming_manager.deliver.assert_called_once()

    # Verify metrics
    metrics = handler.get_metrics()
    assert metrics["total_processed"] == 1
    assert metrics["active_count"] == 0
```

#### Test: Concurrent Message Simulation

```python
@pytest.mark.asyncio
async def test_concurrent_messages_from_multiple_chats():
    """Simulate high-volume concurrent messages."""
    # Setup
    handler = create_handler_with_mocks()

    # Simulate 100 messages from 50 different chats
    messages = []
    for i in range(100):
        chat_num = i % 50  # 50 unique chats
        messages.append(MagicMock(
            message_id=f"msg-{i}",
            chat_id=f"chat-{chat_num}",
            user_id=f"user-{chat_num}",
            text=f"Message {i}",
            provider_name="telegram",
            timestamp=datetime.now(timezone.utc),
        ))

    # Fire all at once
    tasks = [handler.handle(msg) for msg in messages]
    await asyncio.gather(*tasks)

    # Wait for processing
    await asyncio.sleep(1.0)

    # Verify no active tasks remain
    assert handler.get_active_count() == 0

    # Verify metrics
    metrics = handler.get_metrics()
    assert metrics["total_processed"] + metrics["total_queued"] == 100
```

### Manual Testing

#### Local Development Test

```python
# scripts/test_message_handler.py
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime, timezone

from src.apps.bot.message_handler import BotMessageHandler

async def main():
    handler = BotMessageHandler(
        ai_client=MagicMock(),
        messaging_client=MagicMock(send_message=AsyncMock()),
        user_identity=MagicMock(resolve=AsyncMock(return_value="user-1")),
        streaming_manager=MagicMock(deliver=AsyncMock()),
        config=MagicMock(error_message="Error", busy_message="Busy"),
    )

    # Simulate messages
    for i in range(5):
        msg = MagicMock(
            message_id=f"msg-{i}",
            chat_id="chat-1",  # Same chat
            user_id="user-1",
            text=f"Hello {i}",
            provider_name="telegram",
            timestamp=datetime.now(timezone.utc),
        )
        await handler.handle(msg)
        await asyncio.sleep(0.1)

    # Wait for completion
    await asyncio.sleep(1.0)

    print("Metrics:", handler.get_metrics())

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 10. Monitoring & Metrics

### Built-in Metrics

```python
handler.get_metrics()
# Returns:
{
    "total_processed": 1234,
    "total_errors": 12,
    "total_queued": 45,
    "active_count": 3,
    "active_tasks": [
        {
            "chat": "telegram:12345",
            "message_id": "msg-abc",
            "started_at": "2026-03-30T10:00:00Z",
            "duration_seconds": 2.5,
            "hint": "What's the weather...",
        },
        # ...
    ],
}
```

### Health Check Endpoint

```python
# In BotApp health check
async def health_check() -> dict:
    return {
        "status": "healthy",
        "message_handler": {
            "active_count": handler.get_active_count(),
            "total_processed": handler._total_processed,
            "error_rate": (
                handler._total_errors / max(handler._total_processed, 1)
            ),
        },
    }
```

### Prometheus Metrics (Optional)

```python
from prometheus_client import Counter, Gauge, Histogram

# Define metrics
MESSAGES_PROCESSED = Counter(
    "bot_messages_processed_total",
    "Total messages processed",
    ["status"],  # success, error, cancelled
)

ACTIVE_TASKS = Gauge(
    "bot_active_tasks",
    "Number of active processing tasks",
)

PROCESSING_TIME = Histogram(
    "bot_message_processing_seconds",
    "Time to process a message",
    ["provider"],
)

# In _process_message:
start = time.time()
try:
    # ... processing ...
    MESSAGES_PROCESSED.labels(status="success").inc()
except Exception:
    MESSAGES_PROCESSED.labels(status="error").inc()
    raise
finally:
    PROCESSING_TIME.labels(provider=incoming.provider_name).observe(
        time.time() - start
    )
```

### Logging Integration

```python
# Structured logging for analysis
import structlog

logger = structlog.get_logger()

# In _process_message:
logger.info(
    "message_processed",
    message_id=incoming.message_id,
    chat_id=incoming.chat_id,
    provider=incoming.provider_name,
    user_id=user_id,
    conversation_id=conversation_id,
    duration_ms=elapsed_ms,
)
```

### Alerting Recommendations

| Metric | Threshold | Action |
|--------|-----------|--------|
| `error_rate` | > 5% | Alert ops team |
| `active_count` | > 100 | Scale horizontally |
| `processing_time` p99 | > 30s | Investigate AI latency |
| `queued_messages` | Increasing | Add capacity |

---

## 11. File Change Manifest

### Files to Create

| File | Purpose |
|------|---------|
| `src/apps/bot/message_handler.py` | BotMessageHandler class |
| `tests/apps/bot/test_message_handler.py` | Unit and integration tests |

### Files to Modify (Later Phases)

| File | Changes |
|------|---------|
| `src/apps/bot/app.py` | Initialize BotMessageHandler, call cancel_all() on shutdown |
| `src/lib/services/ai_client/client.py` | Add `get_conversation_for_chat()`, `create_conversation()` |
| `src/lib/services/messaging/base.py` | Ensure MessagingClient interface matches |

---

## 12. Implementation Checklist

- [ ] Create `src/apps/bot/message_handler.py`
- [ ] Implement `ChatKey` dataclass
- [ ] Implement `ActiveTaskInfo` dataclass
- [ ] Implement `BotMessageHandler.__init__()`
- [ ] Implement `BotMessageHandler.handle()`
- [ ] Implement `BotMessageHandler._process_message()`
- [ ] Implement `BotMessageHandler._get_or_create_conversation()`
- [ ] Implement `BotMessageHandler._cleanup_callback()`
- [ ] Implement `BotMessageHandler._remove_active_task()`
- [ ] Implement `BotMessageHandler._send_busy_hint()`
- [ ] Implement `BotMessageHandler._send_error_message()`
- [ ] Implement `BotMessageHandler.cancel_all()`
- [ ] Implement `BotMessageHandler.get_active_count()`
- [ ] Implement `BotMessageHandler.get_metrics()`
- [ ] Implement `BotMessageHandler.update_chat_mapping()`
- [ ] Implement `BotMessageHandler.remove_chat_mapping()`
- [ ] Create `tests/apps/bot/test_message_handler.py`
- [ ] Write unit tests for all methods
- [ ] Write integration test for full flow
- [ ] Write concurrent message test
- [ ] Add type hints and docstrings
- [ ] Run linting and type checking
- [ ] Manual testing with mock platform adapter

---

## 13. Future Enhancements

These are out of scope for Phase 4 but worth considering:

1. **Message Queue**: Instead of rejecting when busy, queue messages per chat
2. **Priority Processing**: Support urgent messages that preempt queue
3. **Rate Limiting**: Per-user and per-chat rate limits
4. **Retry Logic**: Automatic retry for transient errors
5. **Circuit Breaker**: Stop processing if AI provider is down
6. **Distributed Locking**: Support multi-instance deployment with Redis locks
7. **Conversation Persistence**: Persist _chat_map to survive restarts
8. **Metrics Export**: Prometheus/OpenMetrics integration
9. **Tracing**: OpenTelemetry for distributed tracing
10. **Dead Letter Queue**: Store failed messages for analysis
