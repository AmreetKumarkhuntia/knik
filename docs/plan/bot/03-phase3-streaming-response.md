# Phase 3: StreamingResponseManager

## 1. Purpose & Scope

### Overview
Phase 3 implements the `StreamingResponseManager` - a component that handles provider-adaptive AI response delivery. It intelligently routes between streaming and non-streaming response modes based on the underlying messaging provider's capabilities.

### Goals
- Provide a unified interface for delivering AI responses regardless of provider
- Enable real-time streaming updates for providers supporting message editing (Telegram)
- Gracefully fall back to complete-message delivery for providers without edit support
- Handle edge cases: message length limits, edit failures, stream errors

### Scope
| In Scope | Out of Scope |
|----------|--------------|
| Response delivery orchestration | AI client implementation |
| Provider capability detection | Messaging provider implementation |
| Debounced message editing | Conversation history management |
| Text chunking for length limits | User identity management |

### Dependencies
- **Phase 1**: `BaseMessagingProvider.supports_message_edit()`, `BaseMessagingProvider.edit_message()`
- **Phase 2**: `BotConfig`, `MessagingClient`
- **Existing**: `AIClient.achat()`, `AIClient.achat_stream()`

---

## 2. Class Design

### File Location
```
src/apps/bot/streaming.py
```

### Imports
```python
from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .client import MessagingClient
    from .config import BotConfig
    from core.ai import AIClient

logger = logging.getLogger(__name__)
```

### Constants
```python
DEFAULT_EDIT_DEBOUNCE_INTERVAL: float = 0.5  # seconds
DEFAULT_PLACEHOLDER_TEXT: str = "..."
TELEGRAM_MAX_MESSAGE_LENGTH: int = 4096
DEFAULT_MAX_MESSAGE_LENGTH: int = 4096
SENTENCE_BOUNDARY_PATTERN = re.compile(r'[.!?。！？\n]')
MIN_CHUNK_SIZE_FOR_EDIT: int = 10  # minimum characters before first edit
```

### Data Classes

```python
@dataclass
class DeliveryResult:
    """Result of a response delivery operation."""
    response_text: str
    conversation_id: str | None
    usage: dict = field(default_factory=dict)
    message_ids: list[str] = field(default_factory=list)
    was_streaming: bool = False
    edit_count: int = 0
    error: str | None = None


@dataclass
class StreamingState:
    """Mutable state during a single streaming delivery."""
    accumulated_text: str = ""
    last_edit_text: str = ""
    last_edit_time: float = 0.0
    message_ids: list[str] = field(default_factory=list)
    current_message_idx: int = 0
    edit_count: int = 0
    pending_edit_task: asyncio.Task | None = None
    stream_complete: bool = False
    error: str | None = None


class DeliveryMode(Enum):
    """Response delivery mode."""
    STREAMING = "streaming"
    COMPLETE = "complete"
```

### Main Class

```python
class StreamingResponseManager:
    """
    Handles provider-adaptive response delivery.

    Routing Logic:
    - If provider supports message editing → streaming with edits
    - Otherwise → wait for complete response, send as single message

    Features:
    - Debounced editing to avoid rate limits
    - Automatic chunking for messages exceeding length limits
    - Graceful error handling and recovery
    """

    def __init__(
        self,
        messaging_client: MessagingClient,
        config: BotConfig,
        edit_debounce_interval: float = DEFAULT_EDIT_DEBOUNCE_INTERVAL,
        placeholder_text: str = DEFAULT_PLACEHOLDER_TEXT,
        max_message_length: int = DEFAULT_MAX_MESSAGE_LENGTH,
    ):
        """
        Initialize the streaming response manager.

        Args:
            messaging_client: Client for sending/editing messages
            config: Bot configuration
            edit_debounce_interval: Minimum seconds between edits
            placeholder_text: Initial text for placeholder message
            max_message_length: Maximum characters per message
        """
        self._messaging_client = messaging_client
        self._config = config
        self._edit_debounce_interval = edit_debounce_interval
        self._placeholder_text = placeholder_text
        self._max_message_length = max_message_length

    @property
    def edit_debounce_interval(self) -> float:
        """Current debounce interval in seconds."""
        return self._edit_debounce_interval

    @edit_debounce_interval.setter
    def edit_debounce_interval(self, value: float) -> None:
        """Set debounce interval (minimum 0.1s for safety)."""
        self._edit_debounce_interval = max(0.1, value)

    async def deliver(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
        """
        Main entry point for response delivery.

        Routes to streaming or non-streaming based on provider capability.

        Args:
            provider: Provider identifier (e.g., "telegram", "discord")
            chat_id: Target chat/conversation ID
            ai_client: AI client for generating response
            prompt: User prompt to send to AI
            conversation_id: Existing conversation ID for context (if any)
            provider_meta: Provider-specific metadata

        Returns:
            DeliveryResult with response text, conversation ID, and metadata
        """

    async def _send_and_edit(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
        """
        Streaming delivery for providers supporting message editing.

        Flow:
        1. Send placeholder message → capture message_id
        2. Stream from ai_client.achat_stream()
        3. Accumulate text, edit at debounced intervals
        4. Handle chunking if response exceeds message limit
        5. Final edit with complete text

        Args:
            Same as deliver()

        Returns:
            DeliveryResult with streaming metadata
        """

    async def _send_complete(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
        """
        Non-streaming delivery for providers without edit support.

        Flow:
        1. Call ai_client.achat() → get full response
        2. Send complete response (may chunk if over limit)

        Args:
            Same as deliver()

        Returns:
            DeliveryResult without streaming metadata
        """

    # === Internal Helper Methods ===

    def _detect_sentence_boundary(self, text: str) -> bool:
        """Check if text ends with a sentence boundary."""

    def _should_edit_now(
        self,
        state: StreamingState,
        force: bool = False,
    ) -> bool:
        """Determine if a debounced edit should be triggered."""

    def _chunk_text(self, text: str) -> list[str]:
        """Split text into chunks respecting message length limits."""

    async def _send_placeholder(
        self,
        provider: str,
        chat_id: str,
        provider_meta: dict,
    ) -> str | None:
        """Send initial placeholder message, return message_id or None."""

    async def _edit_message_safe(
        self,
        provider: str,
        chat_id: str,
        message_id: str,
        text: str,
        provider_meta: dict,
    ) -> bool:
        """Edit message with error handling, return success status."""

    async def _send_overflow_chunk(
        self,
        provider: str,
        chat_id: str,
        text: str,
        provider_meta: dict,
    ) -> str | None:
        """Send overflow text as new message, return message_id."""

    async def _handle_stream_error(
        self,
        provider: str,
        chat_id: str,
        state: StreamingState,
        error: Exception,
        provider_meta: dict,
    ) -> None:
        """Handle errors during streaming, notify user."""
```

---

## 3. Internal Helper Methods

### 3.1 Sentence Boundary Detection

```python
def _detect_sentence_boundary(self, text: str) -> bool:
    """
    Check if text ends with a sentence boundary character.

    Detects: . ! ? 。！？ and newlines

    Args:
        text: Text to check

    Returns:
        True if text ends with sentence boundary
    """
    if not text:
        return False
    return bool(SENTENCE_BOUNDARY_PATTERN.match(text[-1]))
```

### 3.2 Debounce Logic

```python
def _should_edit_now(
    self,
    state: StreamingState,
    force: bool = False,
) -> bool:
    """
    Determine if a debounced edit should be triggered.

    Conditions for editing:
    1. force=True (stream ended, final edit)
    2. Sentence boundary detected AND minimum text accumulated
    3. Debounce timer elapsed AND new text exists

    Args:
        state: Current streaming state
        force: Force edit regardless of debounce

    Returns:
        True if edit should be performed now
    """
    if force:
        return state.accumulated_text != state.last_edit_text

    current_time = asyncio.get_event_loop().time()
    time_since_last_edit = current_time - state.last_edit_time

    new_text = state.accumulated_text[len(state.last_edit_text):]

    # Not enough new text
    if len(new_text) < MIN_CHUNK_SIZE_FOR_EDIT:
        return False

    # Sentence boundary - edit immediately
    if self._detect_sentence_boundary(new_text):
        return True

    # Debounce timer elapsed
    if time_since_last_edit >= self._edit_debounce_interval:
        return True

    return False
```

### 3.3 Text Chunking

```python
def _chunk_text(self, text: str) -> list[str]:
    """
    Split text into chunks respecting message length limits.

    Tries to split at natural boundaries (newlines, spaces) when possible.

    Args:
        text: Full text to chunk

    Returns:
        List of text chunks, each within max_message_length
    """
    if len(text) <= self._max_message_length:
        return [text]

    chunks = []
    remaining = text

    while remaining:
        if len(remaining) <= self._max_message_length:
            chunks.append(remaining)
            break

        # Find best split point within limit
        split_point = self._find_split_point(remaining, self._max_message_length)
        chunks.append(remaining[:split_point].rstrip())
        remaining = remaining[split_point:].lstrip()

    return chunks


def _find_split_point(self, text: str, max_length: int) -> int:
    """
    Find optimal split point in text.

    Priority:
    1. Newline within last 500 chars
    2. Space within last 200 chars
    3. Hard split at max_length

    Args:
        text: Text to analyze
        max_length: Maximum allowed length

    Returns:
        Index to split at
    """
    search_start = max(0, max_length - 500)
    newline_pos = text.rfind('\n', search_start, max_length)

    if newline_pos > search_start:
        return newline_pos + 1

    # Try space
    space_start = max(0, max_length - 200)
    space_pos = text.rfind(' ', space_start, max_length)

    if space_pos > space_start:
        return space_pos + 1

    # Hard split
    return max_length
```

### 3.4 Safe Edit with Error Handling

```python
async def _edit_message_safe(
    self,
    provider: str,
    chat_id: str,
    message_id: str,
    text: str,
    provider_meta: dict,
) -> bool:
    """
    Edit message with comprehensive error handling.

    Handles:
    - Message not found (deleted by user) → log, return False
    - Rate limiting → log, return False
    - Network errors → log, return False

    Args:
        provider: Provider identifier
        chat_id: Chat ID
        message_id: Message to edit
        text: New text content
        provider_meta: Provider metadata

    Returns:
        True if edit succeeded, False otherwise
    """
    try:
        await self._messaging_client.edit_message(
            provider=provider,
            chat_id=chat_id,
            message_id=message_id,
            text=text,
            **provider_meta,
        )
        return True
    except Exception as e:
        logger.warning(
            "Failed to edit message",
            extra={
                "provider": provider,
                "chat_id": chat_id,
                "message_id": message_id,
                "error": str(e),
            }
        )
        return False
```

### 3.5 Placeholder Message

```python
async def _send_placeholder(
    self,
    provider: str,
    chat_id: str,
    provider_meta: dict,
) -> str | None:
    """
    Send initial placeholder message.

    Args:
        provider: Provider identifier
        chat_id: Target chat
        provider_meta: Provider metadata

    Returns:
        Message ID if successful, None otherwise
    """
    try:
        result = await self._messaging_client.send_message(
            provider=provider,
            chat_id=chat_id,
            text=self._placeholder_text,
            **provider_meta,
        )
        return result.get("message_id")
    except Exception as e:
        logger.error(
            "Failed to send placeholder message",
            extra={
                "provider": provider,
                "chat_id": chat_id,
                "error": str(e),
            }
        )
        return None
```

### 3.6 Overflow Chunk Handling

```python
async def _send_overflow_chunk(
    self,
    provider: str,
    chat_id: str,
    text: str,
    provider_meta: dict,
) -> str | None:
    """
    Send overflow text as a new message.

    Called when streaming response exceeds single message limit.

    Args:
        provider: Provider identifier
        chat_id: Target chat
        text: Text to send
        provider_meta: Provider metadata

    Returns:
        Message ID if successful, None otherwise
    """
    try:
        result = await self._messaging_client.send_message(
            provider=provider,
            chat_id=chat_id,
            text=text,
            **provider_meta,
        )
        return result.get("message_id")
    except Exception as e:
        logger.error(
            "Failed to send overflow chunk",
            extra={
                "provider": provider,
                "chat_id": chat_id,
                "error": str(e),
            }
        )
        return None
```

### 3.7 Stream Error Handling

```python
async def _handle_stream_error(
    self,
    provider: str,
    chat_id: str,
    state: StreamingState,
    error: Exception,
    provider_meta: dict,
) -> None:
    """
    Handle errors during streaming delivery.

    Attempts to update the placeholder/error message with error info.

    Args:
        provider: Provider identifier
        chat_id: Target chat
        state: Current streaming state
        error: The exception that occurred
        provider_meta: Provider metadata
    """
    error_message = f"❌ An error occurred while generating the response."

    if state.message_ids:
        # Try to edit existing message
        message_id = state.message_ids[0]
        await self._edit_message_safe(
            provider=provider,
            chat_id=chat_id,
            message_id=message_id,
            text=error_message,
            provider_meta=provider_meta,
        )
    else:
        # Send new error message
        await self._send_overflow_chunk(
            provider=provider,
            chat_id=chat_id,
            text=error_message,
            provider_meta=provider_meta,
        )

    state.error = str(error)
```

---

## 4. State Management

### 4.1 StreamingState Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Streaming Delivery Flow                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Initialize State                                         │
│     state = StreamingState()                                │
│     state.last_edit_time = time.now()                       │
│                                                              │
│  2. Send Placeholder                                         │
│     message_id = await _send_placeholder()                  │
│     state.message_ids = [message_id]                        │
│                                                              │
│  3. Stream Loop                                              │
│     async for chunk in ai_client.achat_stream():           │
│         state.accumulated_text += chunk                     │
│                                                              │
│         if _should_edit_now(state):                         │
│             await _perform_edit(state)                      │
│             state.edit_count += 1                           │
│             state.last_edit_time = time.now()               │
│                                                              │
│         # Handle overflow                                    │
│         if len(current_chunk) > max_length:                 │
│             await _handle_overflow(state)                   │
│                                                              │
│  4. Final Edit                                               │
│     await _perform_edit(state, force=True)                  │
│     state.stream_complete = True                            │
│                                                              │
│  5. Return Result                                            │
│     return DeliveryResult(                                  │
│         response_text=state.accumulated_text,               │
│         message_ids=state.message_ids,                      │
│         edit_count=state.edit_count,                        │
│         was_streaming=True,                                 │
│     )                                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 State Transitions

```python
# State transition diagram (pseudocode)

INIT --> PLACEHOLDER_SENT: send placeholder success
INIT --> ERROR: send placeholder fails

PLACEHOLDER_SENT --> STREAMING: stream starts
PLACEHOLDER_SENT --> ERROR: stream fails to start

STREAMING --> EDITING: debounce triggered or sentence boundary
STREAMING --> OVERFLOW: message exceeds max length
STREAMING --> COMPLETE: stream ends

EDITING --> STREAMING: edit complete
EDITING --> ERROR: unrecoverable edit error

OVERFLOW --> STREAMING: overflow message sent

COMPLETE --> RETURN: final edit done

ERROR --> RETURN: error message sent
```

---

## 5. Main Method Implementations

### 5.1 deliver()

```python
async def deliver(
    self,
    provider: str,
    chat_id: str,
    ai_client: AIClient,
    prompt: str,
    conversation_id: str | None,
    provider_meta: dict,
) -> DeliveryResult:
    """
    Main entry point. Routes based on provider capability.
    """
    try:
        supports_edit = self._messaging_client.supports_message_edit(provider)

        if supports_edit:
            logger.debug(
                "Using streaming delivery",
                extra={"provider": provider, "chat_id": chat_id}
            )
            return await self._send_and_edit(
                provider=provider,
                chat_id=chat_id,
                ai_client=ai_client,
                prompt=prompt,
                conversation_id=conversation_id,
                provider_meta=provider_meta,
            )
        else:
            logger.debug(
                "Using complete delivery",
                extra={"provider": provider, "chat_id": chat_id}
            )
            return await self._send_complete(
                provider=provider,
                chat_id=chat_id,
                ai_client=ai_client,
                prompt=prompt,
                conversation_id=conversation_id,
                provider_meta=provider_meta,
            )

    except Exception as e:
        logger.exception("Delivery failed")
        return DeliveryResult(
            response_text="",
            conversation_id=conversation_id,
            error=str(e),
        )
```

### 5.2 _send_and_edit()

```python
async def _send_and_edit(
    self,
    provider: str,
    chat_id: str,
    ai_client: AIClient,
    prompt: str,
    conversation_id: str | None,
    provider_meta: dict,
) -> DeliveryResult:
    """
    Streaming delivery with debounced editing.
    """
    state = StreamingState()
    state.last_edit_time = asyncio.get_event_loop().time()
    usage = {}

    # 1. Send placeholder
    message_id = await self._send_placeholder(provider, chat_id, provider_meta)
    if not message_id:
        return DeliveryResult(
            response_text="",
            conversation_id=conversation_id,
            error="Failed to send placeholder message",
        )
    state.message_ids.append(message_id)

    # 2. Stream response
    try:
        async for chunk in ai_client.achat_stream(
            prompt=prompt,
            conversation_id=conversation_id,
        ):
            # Handle different chunk formats
            if isinstance(chunk, dict):
                if "text" in chunk:
                    state.accumulated_text += chunk["text"]
                if "usage" in chunk:
                    usage = chunk["usage"]
                if "conversation_id" in chunk:
                    conversation_id = chunk["conversation_id"]
            else:
                state.accumulated_text += str(chunk)

            # Check for edit
            if self._should_edit_now(state):
                await self._update_messages(provider, chat_id, state, provider_meta)

        # 3. Final update
        await self._update_messages(provider, chat_id, state, provider_meta, force=True)

        return DeliveryResult(
            response_text=state.accumulated_text,
            conversation_id=conversation_id,
            usage=usage,
            message_ids=state.message_ids,
            was_streaming=True,
            edit_count=state.edit_count,
        )

    except Exception as e:
        await self._handle_stream_error(provider, chat_id, state, e, provider_meta)
        return DeliveryResult(
            response_text=state.accumulated_text,
            conversation_id=conversation_id,
            usage=usage,
            message_ids=state.message_ids,
            error=str(e),
        )


async def _update_messages(
    self,
    provider: str,
    chat_id: str,
    state: StreamingState,
    provider_meta: dict,
    force: bool = False,
) -> None:
    """
    Update messages with current accumulated text.
    Handles chunking if text exceeds limits.
    """
    if not self._should_edit_now(state, force=force):
        return

    chunks = self._chunk_text(state.accumulated_text)

    # Update existing messages
    for i, chunk in enumerate(chunks):
        if i < len(state.message_ids):
            # Edit existing message
            success = await self._edit_message_safe(
                provider=provider,
                chat_id=chat_id,
                message_id=state.message_ids[i],
                text=chunk,
                provider_meta=provider_meta,
            )
            if not success and i == 0:
                # Primary message edit failed, try to recover
                new_id = await self._send_overflow_chunk(
                    provider=provider,
                    chat_id=chat_id,
                    text=chunk,
                    provider_meta=provider_meta,
                )
                if new_id:
                    state.message_ids[i] = new_id
        else:
            # Need new message for overflow
            new_id = await self._send_overflow_chunk(
                provider=provider,
                chat_id=chat_id,
                text=chunk,
                provider_meta=provider_meta,
            )
            if new_id:
                state.message_ids.append(new_id)

    state.last_edit_text = state.accumulated_text
    state.last_edit_time = asyncio.get_event_loop().time()
    state.edit_count += 1
```

### 5.3 _send_complete()

```python
async def _send_complete(
    self,
    provider: str,
    chat_id: str,
    ai_client: AIClient,
    prompt: str,
    conversation_id: str | None,
    provider_meta: dict,
) -> DeliveryResult:
    """
    Non-streaming delivery.
    """
    try:
        # Get complete response
        response = await ai_client.achat(
            prompt=prompt,
            conversation_id=conversation_id,
        )

        # Extract response data
        response_text = response.get("text", "")
        usage = response.get("usage", {})
        conversation_id = response.get("conversation_id", conversation_id)

        # Handle empty response
        if not response_text:
            response_text = "I apologize, but I couldn't generate a response."

        # Chunk and send
        chunks = self._chunk_text(response_text)
        message_ids = []

        for chunk in chunks:
            result = await self._messaging_client.send_message(
                provider=provider,
                chat_id=chat_id,
                text=chunk,
                **provider_meta,
            )
            if result and "message_id" in result:
                message_ids.append(result["message_id"])

        return DeliveryResult(
            response_text=response_text,
            conversation_id=conversation_id,
            usage=usage,
            message_ids=message_ids,
            was_streaming=False,
        )

    except Exception as e:
        logger.exception("Complete delivery failed")

        # Try to send error message
        try:
            await self._messaging_client.send_message(
                provider=provider,
                chat_id=chat_id,
                text="❌ An error occurred while generating the response.",
                **provider_meta,
            )
        except Exception:
            pass

        return DeliveryResult(
            response_text="",
            conversation_id=conversation_id,
            error=str(e),
        )
```

---

## 6. Error Handling Strategy

### 6.1 Error Categories

| Error Type | When It Occurs | Handling Strategy |
|------------|----------------|-------------------|
| Placeholder Send Failure | Initial message send | Return error result, don't stream |
| Stream Error | During achat_stream() | Update message with error, log, return partial |
| Edit Failure | Message edit call | Log warning, continue streaming |
| Overflow Send Failure | New message for chunk | Log error, continue with available messages |
| Complete Failure | Non-streaming failure | Send error message, return error result |

### 6.2 Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Error Recovery Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Placeholder Failure:                                        │
│  ┌─────────────┐                                            │
│  │ Send fails  │ ──► Log error ──► Return DeliveryResult    │
│  └─────────────┘                 with error                 │
│                                                              │
│  Stream Error:                                               │
│  ┌─────────────┐     ┌──────────────────┐                  │
│  │ Stream      │ ──► │ Edit placeholder │ ──► Return        │
│  │ throws      │     │ with error msg   │     partial       │
│  └─────────────┘     └──────────────────┘     result        │
│                                                              │
│  Edit Failure:                                               │
│  ┌─────────────┐     ┌──────────────────┐                  │
│  │ Edit fails  │ ──► │ Log warning      │ ──► Continue      │
│  │             │     │ (msg deleted?)   │     streaming     │
│  └─────────────┘     └──────────────────┘                  │
│                                                              │
│  Recovery Attempt:                                           │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ Primary msg     │ ──► │ Send new msg    │ ──► Update     │
│  │ edit fails      │     │ as replacement  │     state      │
│  └─────────────────┘     └─────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Logging Strategy

```python
# Log levels by severity
CRITICAL: Complete system failure (messaging client unavailable)
ERROR:    Failed operations that affect user experience
WARNING:  Recoverable failures (edit failures, rate limits)
INFO:     Delivery start/complete, mode selection
DEBUG:    Debounce decisions, chunk details
```

---

## 7. Dependencies on Previous Phases

### 7.1 Phase 1 Dependencies

```python
# From Phase 1: BaseMessagingProvider

class BaseMessagingProvider(Protocol):
    def supports_message_edit(self) -> bool:
        """Returns True if provider supports message editing."""
        ...

    async def edit_message(
        self,
        chat_id: str,
        message_id: str,
        text: str,
        **kwargs,
    ) -> dict:
        """Edit an existing message."""
        ...
```

**Usage in Phase 3:**
- `StreamingResponseManager.deliver()` calls `supports_message_edit()` to route
- `_send_and_edit()` calls `edit_message()` for debounced updates

### 7.2 Phase 2 Dependencies

```python
# From Phase 2: BotConfig

@dataclass
class BotConfig:
    ai_provider: str
    ai_model: str
    default_temperature: float = 0.7
    max_history_messages: int = 50
    # ... other config fields
```

**Usage in Phase 3:**
- Config accessed for AI client parameters
- Future: streaming-specific config (debounce interval, chunk size)

```python
# From Phase 2: MessagingClient

class MessagingClient:
    def supports_message_edit(self, provider: str) -> bool:
        """Check if provider supports message editing."""
        ...

    async def send_message(
        self,
        provider: str,
        chat_id: str,
        text: str,
        **kwargs,
    ) -> dict:
        """Send a message via the specified provider."""
        ...

    async def edit_message(
        self,
        provider: str,
        chat_id: str,
        message_id: str,
        text: str,
        **kwargs,
    ) -> dict:
        """Edit a message via the specified provider."""
        ...
```

**Usage in Phase 3:**
- All message operations go through MessagingClient
- Provider routing handled by client

### 7.3 Existing Dependencies

```python
# From core.ai: AIClient

class AIClient:
    async def achat(
        self,
        prompt: str,
        conversation_id: str | None = None,
        **kwargs,
    ) -> dict:
        """
        Non-streaming chat completion.
        Returns: {"text": str, "usage": dict, "conversation_id": str}
        """
        ...

    async def achat_stream(
        self,
        prompt: str,
        conversation_id: str | None = None,
        **kwargs,
    ) -> AsyncGenerator[dict | str, None]:
        """
        Streaming chat completion.
        Yields: {"text": str, "usage": dict?, "conversation_id": str?} or str
        """
        ...
```

---

## 8. Testing Instructions

### 8.1 Test File Structure

```
tests/apps/bot/test_streaming.py
```

### 8.2 Mock Fixtures

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from apps.bot.streaming import (
    StreamingResponseManager,
    DeliveryResult,
    StreamingState,
)


@pytest.fixture
def mock_messaging_client():
    """Mock MessagingClient for testing."""
    client = MagicMock()
    client.supports_message_edit = MagicMock(return_value=True)
    client.send_message = AsyncMock(return_value={"message_id": "msg_123"})
    client.edit_message = AsyncMock(return_value={"success": True})
    return client


@pytest.fixture
def mock_config():
    """Mock BotConfig for testing."""
    config = MagicMock()
    config.ai_provider = "openai"
    config.ai_model = "gpt-4"
    return config


@pytest.fixture
def mock_ai_client_streaming():
    """Mock AIClient with streaming support."""
    client = MagicMock()

    async def mock_stream(*args, **kwargs):
        chunks = [
            {"text": "Hello", "conversation_id": "conv_123"},
            {"text": " world", "usage": {"total_tokens": 10}},
            {"text": "!", "usage": {"total_tokens": 15}},
        ]
        for chunk in chunks:
            yield chunk

    client.achat_stream = mock_stream
    return client


@pytest.fixture
def mock_ai_client_complete():
    """Mock AIClient without streaming."""
    client = MagicMock()
    client.achat = AsyncMock(return_value={
        "text": "Hello world!",
        "conversation_id": "conv_123",
        "usage": {"total_tokens": 15},
    })
    return client


@pytest.fixture
def manager(mock_messaging_client, mock_config):
    """Create StreamingResponseManager with mocked dependencies."""
    return StreamingResponseManager(
        messaging_client=mock_messaging_client,
        config=mock_config,
        edit_debounce_interval=0.1,  # Fast for tests
    )
```

### 8.3 Unit Tests

```python
class TestStreamingResponseManager:
    """Tests for StreamingResponseManager."""

    @pytest.mark.asyncio
    async def test_deliver_routes_to_streaming_when_supported(
        self,
        manager,
        mock_messaging_client,
        mock_ai_client_streaming,
    ):
        """Should use streaming when provider supports edit."""
        mock_messaging_client.supports_message_edit.return_value = True

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.was_streaming is True
        assert result.response_text == "Hello world!"
        assert result.conversation_id == "conv_123"
        assert len(result.message_ids) == 1

    @pytest.mark.asyncio
    async def test_deliver_routes_to_complete_when_not_supported(
        self,
        manager,
        mock_messaging_client,
        mock_ai_client_complete,
    ):
        """Should use complete delivery when provider doesn't support edit."""
        mock_messaging_client.supports_message_edit.return_value = False

        result = await manager.deliver(
            provider="discord",
            chat_id="chat_123",
            ai_client=mock_ai_client_complete,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.was_streaming is False
        assert result.response_text == "Hello world!"
        mock_ai_client_complete.achat.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_and_edit_sends_placeholder(
        self,
        manager,
        mock_messaging_client,
        mock_ai_client_streaming,
    ):
        """Should send placeholder message before streaming."""
        await manager._send_and_edit(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        # Placeholder should be sent
        mock_messaging_client.send_message.assert_called()
        first_call_text = mock_messaging_client.send_message.call_args_list[0][1]["text"]
        assert first_call_text == "..."

    @pytest.mark.asyncio
    async def test_send_and_edit_handles_edit_failure(
        self,
        manager,
        mock_messaging_client,
        mock_ai_client_streaming,
    ):
        """Should handle edit failures gracefully."""
        mock_messaging_client.edit_message.side_effect = Exception("Message deleted")

        result = await manager._send_and_edit(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        # Should complete without raising
        assert result.response_text == "Hello world!"

    @pytest.mark.asyncio
    async def test_placeholder_failure_returns_error(
        self,
        manager,
        mock_messaging_client,
        mock_ai_client_streaming,
    ):
        """Should return error when placeholder fails."""
        mock_messaging_client.send_message.side_effect = Exception("Network error")

        result = await manager._send_and_edit(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None
        assert "Failed to send placeholder" in result.error


class TestDebounceLogic:
    """Tests for debounce logic."""

    def test_should_edit_now_returns_false_for_small_text(self, manager):
        """Should not edit for small text additions."""
        state = StreamingState(
            accumulated_text="Hello",
            last_edit_text="",
            last_edit_time=0,
        )

        assert manager._should_edit_now(state) is False

    def test_should_edit_now_returns_true_for_sentence_boundary(self, manager):
        """Should edit immediately on sentence boundary."""
        state = StreamingState(
            accumulated_text="Hello world. How are you?",
            last_edit_text="Hello world",
            last_edit_time=0,
        )

        assert manager._should_edit_now(state) is True

    def test_should_edit_now_returns_true_for_force(self, manager):
        """Should always edit when forced."""
        state = StreamingState(
            accumulated_text="Hello",
            last_edit_text="",
            last_edit_time=0,
        )

        assert manager._should_edit_now(state, force=True) is True

    def test_should_edit_now_returns_true_after_debounce_interval(self, manager):
        """Should edit after debounce interval elapses."""
        import asyncio

        state = StreamingState(
            accumulated_text="Hello world this is a longer text",
            last_edit_text="",
            last_edit_time=asyncio.get_event_loop().time() - 1.0,  # 1 second ago
        )

        assert manager._should_edit_now(state) is True


class TestTextChunking:
    """Tests for text chunking."""

    def test_chunk_text_returns_single_chunk_for_short_text(self, manager):
        """Should return single chunk for short text."""
        text = "Hello world"
        chunks = manager._chunk_text(text)

        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunk_text_splits_long_text(self, manager):
        """Should split text exceeding max length."""
        manager._max_message_length = 100
        text = "A" * 250

        chunks = manager._chunk_text(text)

        assert len(chunks) == 3
        assert all(len(c) <= 100 for c in chunks)
        assert "".join(chunks) == text

    def test_chunk_text_splits_at_newline(self, manager):
        """Should prefer splitting at newlines."""
        manager._max_message_length = 50
        text = "First paragraph here.\n\nSecond paragraph here.\n\nThird one."

        chunks = manager._chunk_text(text)

        # Should split at newlines when possible
        assert len(chunks) > 1

    def test_find_split_point_returns_newline_position(self, manager):
        """Should find newline as split point."""
        text = "First line\nSecond line\nThird line"
        pos = manager._find_split_point(text, 25)

        # Should split at first newline within range
        assert text[pos-1] == '\n' or text[pos] == '\n'


class TestSentenceBoundaryDetection:
    """Tests for sentence boundary detection."""

    def test_detects_period(self, manager):
        assert manager._detect_sentence_boundary("Hello.") is True

    def test_detects_exclamation(self, manager):
        assert manager._detect_sentence_boundary("Hello!") is True

    def test_detects_question(self, manager):
        assert manager._detect_sentence_boundary("Hello?") is True

    def test_detects_newline(self, manager):
        assert manager._detect_sentence_boundary("Hello\n") is True

    def test_detects_no_boundary(self, manager):
        assert manager._detect_sentence_boundary("Hello") is False

    def test_handles_empty_string(self, manager):
        assert manager._detect_sentence_boundary("") is False
```

### 8.4 Integration Tests

```python
class TestStreamingIntegration:
    """Integration tests with more realistic scenarios."""

    @pytest.mark.asyncio
    async def test_full_streaming_flow(self, manager, mock_messaging_client):
        """Test complete streaming flow with multiple chunks."""
        async def mock_stream(*args, **kwargs):
            sentences = [
                "First sentence. ",
                "Second sentence! ",
                "Third sentence?\n",
                "Final text.",
            ]
            for s in sentences:
                yield {"text": s}

        mock_ai = MagicMock()
        mock_ai.achat_stream = mock_stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Test",
            conversation_id=None,
            provider_meta={},
        )

        assert result.was_streaming is True
        assert "First sentence" in result.response_text
        assert result.edit_count > 0  # Should have edited at sentence boundaries

    @pytest.mark.asyncio
    async def test_long_response_chunking(self, manager, mock_messaging_client):
        """Test that long responses are properly chunked."""
        manager._max_message_length = 100

        async def mock_stream(*args, **kwargs):
            text = "A" * 250
            yield {"text": text}

        mock_ai = MagicMock()
        mock_ai.achat_stream = mock_stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Test",
            conversation_id=None,
            provider_meta={},
        )

        # Should have multiple messages
        assert len(result.message_ids) > 1
```

### 8.5 Running Tests

```bash
# Run all streaming tests
pytest tests/apps/bot/test_streaming.py -v

# Run with coverage
pytest tests/apps/bot/test_streaming.py --cov=apps/bot/streaming --cov-report=term-missing

# Run specific test class
pytest tests/apps/bot/test_streaming.py::TestDebounceLogic -v
```

---

## 9. Performance Considerations

### 9.1 Memory Management

| Concern | Mitigation |
|---------|------------|
| Large accumulated text | Text is stored in StreamingState, cleared after delivery |
| Many pending edits | Single edit task, debouncing prevents accumulation |
| Long responses | Chunking prevents single large allocations |

### 9.2 Rate Limiting

```python
# Telegram rate limits (approximate)
# - 30 messages/second to same chat
# - Edit operations are less restricted but still limited

# Configuration recommendations
DEBOUNCE_INTERVAL = 0.5  # Minimum 2 edits/second
MIN_CHUNK_SIZE = 10      # Don't edit for tiny changes
```

### 9.3 Async Performance

```python
# Good: Non-blocking with proper async
async for chunk in ai_client.achat_stream():
    state.accumulated_text += chunk
    if self._should_edit_now(state):
        await self._update_messages(...)  # Non-blocking

# Avoid: Blocking operations in stream loop
# - No synchronous I/O
# - No heavy computation in main loop
```

### 9.4 Resource Cleanup

```python
async def deliver(self, ...):
    state = StreamingState()

    try:
        # ... streaming logic
    finally:
        # Cleanup any pending tasks
        if state.pending_edit_task:
            state.pending_edit_task.cancel()
            try:
                await state.pending_edit_task
            except asyncio.CancelledError:
                pass
```

### 9.5 Monitoring Metrics

```python
# Recommended metrics to track
METRICS = {
    "delivery_duration_seconds": Histogram,
    "edit_count": Counter,
    "chunk_count": Histogram,
    "stream_errors": Counter,
    "placeholder_failures": Counter,
    "message_length_chars": Histogram,
}
```

---

## 10. Future Enhancements

### 10.1 Potential Improvements

1. **Typing Indicators**: Send typing action while streaming
2. **Progressive Formatting**: Apply markdown formatting progressively
3. **Smart Chunking**: Split at semantic boundaries (paragraphs, code blocks)
4. **Cancellable Streaming**: Allow users to cancel mid-stream
5. **Edit Queuing**: Queue edits when rate-limited, replay when allowed

### 10.2 Configuration Extensions

```python
@dataclass
class StreamingConfig:
    """Future streaming-specific configuration."""
    debounce_interval: float = 0.5
    placeholder_text: str = "..."
    max_message_length: int = 4096
    enable_typing_indicator: bool = True
    sentence_boundary_edit: bool = True
    max_edit_retries: int = 3
```

---

## 11. Checklist

- [ ] Create `src/apps/bot/streaming.py`
- [ ] Implement `StreamingResponseManager` class
- [ ] Implement `DeliveryResult` and `StreamingState` dataclasses
- [ ] Implement `deliver()` routing method
- [ ] Implement `_send_and_edit()` streaming method
- [ ] Implement `_send_complete()` non-streaming method
- [ ] Implement debounce logic with `_should_edit_now()`
- [ ] Implement text chunking with `_chunk_text()` and `_find_split_point()`
- [ ] Implement sentence boundary detection
- [ ] Implement error handling for all failure modes
- [ ] Add comprehensive logging
- [ ] Create unit tests in `tests/apps/bot/test_streaming.py`
- [ ] Add integration tests
- [ ] Verify Phase 1 and Phase 2 dependencies
- [ ] Run type checking: `mypy src/apps/bot/streaming.py`
- [ ] Run linting: `ruff check src/apps/bot/streaming.py`
- [ ] Update documentation
