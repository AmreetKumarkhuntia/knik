# Phase 1: Messaging Infrastructure Extension

## Overview

**Phase:** 1 of N
**Focus:** Message editing support and provider identification
**Estimated Effort:** 2-3 hours
**Dependencies:** None

---

## Purpose & Scope

This phase extends the messaging infrastructure to support:

1. **Provider Identification**: Messages carry information about which provider sent them, enabling provider-aware message handling.

2. **Message Editing**: Ability to edit previously sent messages, essential for:
   - Updating bot responses with new information
   - Correcting errors in responses
   - Implementing streaming-like UI updates
   - Reducing chat clutter vs. sending new messages

### Out of Scope

- Message deletion (future phase)
- Reply-to-message functionality (future phase)
- Other providers beyond Telegram (future phase)
- Message edit callbacks (receiving edit events from providers)

---

## Task Breakdown

### Task 1.1: Update IncomingMessage

**File:** `src/lib/services/messaging_client/models.py`
**Location:** Line 18-26 (IncomingMessage dataclass)

**Current State:**
```python
@dataclass
class IncomingMessage:
    """A message received from a messaging provider."""

    chat_id: str
    text: str
    sender_id: str | None = None
    sender_name: str | None = None
    timestamp: float | None = None
    raw: dict[str, Any] = field(default_factory=dict)
```

**Implementation:**
Add new field after `timestamp`:

```python
@dataclass
class IncomingMessage:
    """A message received from a messaging provider."""

    chat_id: str
    text: str
    sender_id: str | None = None
    sender_name: str | None = None
    timestamp: float | None = None
    provider_name: str | None = None  # NEW: e.g., "telegram", "slack", "discord"
    raw: dict[str, Any] = field(default_factory=dict)
```

**Implementation Notes:**
- Use `str | None = None` for backward compatibility with existing code
- Field placed after `timestamp` to group metadata together
- `provider_name` should match the value returned by `provider.get_provider_name()`

**Edge Cases:**
- Legacy code that doesn't set `provider_name` will work (defaults to `None`)
- Handler code should handle `None` gracefully with fallback behavior

---

### Task 1.2: Extend BaseMessagingProvider

**File:** `src/lib/services/messaging_client/providers/base_provider.py`
**Location:** After line 33 (end of class)

**Current State:**
```python
class BaseMessagingProvider(ABC):
    """Base class for all messaging providers (Telegram, Slack, Discord, etc.)."""

    @classmethod
    @abstractmethod
    def get_provider_name(cls) -> str: ...

    @abstractmethod
    async def send_message(self, chat_id: str, text: str, **kwargs) -> MessageResult: ...

    @abstractmethod
    async def start(self, on_message: MessageCallback) -> None: ...

    @abstractmethod
    async def stop(self) -> None: ...

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def get_info(self) -> dict[str, Any]: ...
```

**Implementation:**
Add two new non-abstract methods at the end of the class:

```python
class BaseMessagingProvider(ABC):
    # ... existing abstract methods ...

    def supports_message_edit(self) -> bool:
        """Whether this provider supports editing sent messages.

        Override in providers that support message editing.
        Default implementation returns False.

        Returns:
            True if edit_message() is implemented and functional.
        """
        return False

    async def edit_message(
        self, chat_id: str, message_id: str, text: str, **kwargs
    ) -> MessageResult:
        """Edit an existing sent message.

        Override in providers that support message editing.
        Default implementation returns failure.

        Args:
            chat_id: The chat/room/conversation identifier.
            message_id: The identifier of the message to edit.
            text: The new text content for the message.
            **kwargs: Provider-specific options (e.g., parse_mode).

        Returns:
            MessageResult with success=True and updated message_id on success,
            or success=False with error message on failure.
        """
        return MessageResult(
            success=False,
            error="Message editing not supported by this provider"
        )
```

**Implementation Notes:**
- These are **concrete methods**, not abstract - providers only override if they support editing
- `supports_message_edit()` provides a quick check without attempting the operation
- `edit_message()` returns a `MessageResult` for consistency with `send_message()`
- kwargs passed through for provider-specific options like `parse_mode`

**Edge Cases:**
- Provider doesn't support editing: `supports_message_edit()` returns `False`, `edit_message()` returns error
- Message was deleted by user: Provider-specific error handling needed in implementations
- Message too old: Some providers have time limits on edits

---

### Task 1.3: Implement edit_message in TelegramProvider

**File:** `src/lib/services/messaging_client/providers/telegram_provider.py`
**Location:** After line 59 (after `send_message` method, before `start` method)

**Implementation:**
Add these two methods:

```python
def supports_message_edit(self) -> bool:
    """Telegram supports editing messages."""
    return True

async def edit_message(
    self, chat_id: str, message_id: str, text: str, **kwargs
) -> MessageResult:
    """Edit an existing sent message in Telegram.

    Args:
        chat_id: Telegram chat ID (will be converted to int).
        message_id: The message_id returned from a previous send_message.
        text: New text content (max 4096 chars per message).
        **kwargs: Passed to bot.edit_message_text (e.g., parse_mode).

    Returns:
        MessageResult with success status.
    """
    if not self.is_configured():
        return MessageResult(success=False, error="TelegramProvider is not configured")

    bot = self._app.bot if self._app else self._bot

    try:
        chunks = _split_text(text, max_len=4096)

        # Edit the original message with first chunk
        msg = await bot.edit_message_text(
            chat_id=int(chat_id),
            message_id=int(message_id),
            text=chunks[0],
            **kwargs,
        )

        # If text was split, send remaining chunks as new messages
        # (Telegram can only edit one message, not insert new ones)
        for chunk in chunks[1:]:
            await bot.send_message(
                chat_id=int(chat_id),
                text=chunk,
                **kwargs,
            )

        return MessageResult(
            success=True,
            message_id=str(msg.message_id),
        )
    except Exception as e:
        error_str = str(e)
        printer.error(f"Telegram edit_message failed: {error_str}")
        return MessageResult(success=False, error=error_str)
```

**Implementation Notes:**
- Reuses existing `_split_text()` helper for 4096 char limit
- **Important behavior**: Only the first chunk edits the original message; additional chunks are sent as new messages (Telegram API limitation)
- Converts `chat_id` and `message_id` to `int` as required by python-telegram-bot
- Uses same error handling pattern as `send_message()`

**Edge Cases to Handle:**

| Scenario | Telegram API Behavior | Our Handling |
|----------|----------------------|--------------|
| Message deleted | Raises `BadRequest` with "message to edit not found" | Returns `MessageResult(success=False, error=...)` |
| Message too old | No strict limit for bots, but may fail | Returns error from API |
| Same text (no change) | Raises `BadRequest` with "message is not modified" | Returns error (caller can handle) |
| Rate limited | May raise `RetryAfter` exception | Returns error; caller should implement backoff |
| Invalid message_id | Raises `BadRequest` | Returns error |
| Bot lacks permission | Raises `Forbidden` | Returns error |

**Consider Adding (Optional Enhancement):**
```python
from telegram.error import BadRequest, Forbidden, RetryAfter

# In edit_message, for more specific error handling:
except BadRequest as e:
    if "message to edit not found" in str(e):
        return MessageResult(success=False, error="Message was deleted")
    elif "message is not modified" in str(e):
        return MessageResult(success=True, message_id=message_id)  # No-op success
    return MessageResult(success=False, error=str(e))
except Forbidden as e:
    return MessageResult(success=False, error=f"Permission denied: {e}")
except RetryAfter as e:
    return MessageResult(success=False, error=f"Rate limited, retry after {e.retry_after}s")
```

---

### Task 1.4: Set provider_name in TelegramProvider

**File:** `src/lib/services/messaging_client/providers/telegram_provider.py`
**Location:** Line 99-106 (`_handle_message` method)

**Current State:**
```python
async def _handle_message(self, update: Update, context) -> None:
    """Process an incoming Telegram update and forward to callback."""
    if update.message is None or update.message.text is None:
        return

    incoming = IncomingMessage(
        chat_id=str(update.message.chat_id),
        text=update.message.text,
        sender_id=str(update.message.from_user.id) if update.message.from_user else None,
        sender_name=update.message.from_user.full_name if update.message.from_user else None,
        timestamp=update.message.date.timestamp() if update.message.date else None,
        raw=update.to_dict(),
    )

    if self._on_message:
        await self._on_message(incoming)
```

**Implementation:**
Add `provider_name` field:

```python
async def _handle_message(self, update: Update, context) -> None:
    """Process an incoming Telegram update and forward to callback."""
    if update.message is None or update.message.text is None:
        return

    incoming = IncomingMessage(
        chat_id=str(update.message.chat_id),
        text=update.message.text,
        sender_id=str(update.message.from_user.id) if update.message.from_user else None,
        sender_name=update.message.from_user.full_name if update.message.from_user else None,
        timestamp=update.message.date.timestamp() if update.message.date else None,
        provider_name="telegram",  # NEW: Identify the provider
        raw=update.to_dict(),
    )

    if self._on_message:
        await self._on_message(incoming)
```

**Implementation Notes:**
- Uses string literal `"telegram"` which matches `cls.get_provider_name()` return value
- Consider using `self.get_provider_name()` for consistency, but string literal is simpler and avoids confusion in IDE/type checkers
- Place before `raw` to maintain logical ordering of fields

**Edge Cases:**
- None - this is a straightforward addition

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `python-telegram-bot` | External | Already installed |
| `IncomingMessage` dataclass | Internal | Existing |
| `MessageResult` dataclass | Internal | Existing |
| `_split_text` helper | Internal | Existing in telegram_provider.py |

**No new dependencies required for Phase 1.**

---

## Testing Instructions

### Unit Tests (Recommended)

Create `tests/lib/services/messaging_client/test_models.py`:

```python
"""Tests for messaging client models."""

from src.lib.services.messaging_client.models import IncomingMessage, MessageResult


def test_incoming_message_with_provider_name():
    msg = IncomingMessage(
        chat_id="123",
        text="Hello",
        provider_name="telegram",
    )
    assert msg.provider_name == "telegram"


def test_incoming_message_without_provider_name():
    msg = IncomingMessage(
        chat_id="123",
        text="Hello",
    )
    assert msg.provider_name is None
```

Create `tests/lib/services/messaging_client/providers/test_base_provider.py`:

```python
"""Tests for base messaging provider."""

import pytest

from src.lib.services.messaging_client.providers.base_provider import BaseMessagingProvider
from src.lib.services.messaging_client.models import MessageResult


class MockProvider(BaseMessagingProvider):
    """Minimal implementation for testing."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "mock"

    async def send_message(self, chat_id: str, text: str, **kwargs) -> MessageResult:
        return MessageResult(success=True, message_id="1")

    async def start(self, on_message) -> None:
        pass

    async def stop(self) -> None:
        pass

    def is_configured(self) -> bool:
        return True

    def get_info(self) -> dict:
        return {}


@pytest.mark.asyncio
async def test_default_supports_message_edit():
    provider = MockProvider()
    assert provider.supports_message_edit() is False


@pytest.mark.asyncio
async def test_default_edit_message_returns_error():
    provider = MockProvider()
    result = await provider.edit_message("123", "1", "text")
    assert result.success is False
    assert "not supported" in result.error.lower()
```

Create `tests/lib/services/messaging_client/providers/test_telegram_provider.py`:

```python
"""Tests for Telegram provider."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.lib.services.messaging_client.providers.telegram_provider import (
    TelegramProvider,
    _split_text,
)


class TestSplitText:
    def test_short_text_unchanged(self):
        assert _split_text("Hello") == ["Hello"]

    def test_exact_max_len_unchanged(self):
        text = "x" * 4096
        assert _split_text(text) == [text]

    def test_splits_at_newline(self):
        text = "line1\n" + "x" * 4100
        chunks = _split_text(text)
        assert len(chunks) == 2
        assert chunks[0].endswith("line1")

    def test_splits_hard_when_no_newline(self):
        text = "x" * 5000
        chunks = _split_text(text)
        assert len(chunks) == 2
        assert len(chunks[0]) == 4096


class TestTelegramProviderEditMessage:
    @pytest.fixture
    def provider(self):
        with patch.object(TelegramProvider, '__init__', lambda self, **kwargs: None):
            provider = TelegramProvider.__new__(TelegramProvider)
            provider._token = "test_token"
            provider._bot = MagicMock()
            provider._app = None
            yield provider

    @pytest.mark.asyncio
    async def test_supports_message_edit(self, provider):
        assert provider.supports_message_edit() is True

    @pytest.mark.asyncio
    async def test_edit_message_success(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 123
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg)
        provider._bot.send_message = AsyncMock()

        result = await provider.edit_message("456", "789", "New text")

        assert result.success is True
        assert result.message_id == "123"
        provider._bot.edit_message_text.assert_called_once_with(
            chat_id=456,
            message_id=789,
            text="New text",
        )

    @pytest.mark.asyncio
    async def test_edit_message_with_chunks(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 123
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg)
        provider._bot.send_message = AsyncMock()

        long_text = "x" * 5000
        result = await provider.edit_message("456", "789", long_text)

        assert result.success is True
        provider._bot.edit_message_text.assert_called_once()
        provider._bot.send_message.assert_called_once()  # Second chunk

    @pytest.mark.asyncio
    async def test_edit_message_not_configured(self):
        with patch.object(TelegramProvider, '__init__', lambda self, **kwargs: None):
            provider = TelegramProvider.__new__(TelegramProvider)
            provider._token = None
            provider._bot = None
            provider._app = None

            result = await provider.edit_message("456", "789", "text")
            assert result.success is False
            assert "not configured" in result.error.lower()
```

### Manual Testing

#### Test 1: Verify provider_name is set

1. Start the bot with Telegram configured
2. Send a message to the bot
3. Add logging in your message handler to verify `incoming.provider_name == "telegram"`

```python
# In your message handler
async def handle_message(incoming: IncomingMessage):
    print(f"Provider: {incoming.provider_name}")  # Should print "telegram"
```

#### Test 2: Verify message editing works

1. Start the bot
2. Have the bot send a message
3. Call `edit_message` with the returned message_id

```python
# Send a message
result = await provider.send_message(chat_id, "Original message")
msg_id = result.message_id

# Edit it
edit_result = await provider.edit_message(chat_id, msg_id, "Edited message")
assert edit_result.success
```

#### Test 3: Verify error handling

1. Try to edit a non-existent message:
```python
result = await provider.edit_message(chat_id, "999999", "text")
assert not result.success
print(f"Error: {result.error}")
```

2. Try to edit a deleted message:
```python
# Send, then manually delete in Telegram app, then try to edit
result = await provider.send_message(chat_id, "Delete me")
# ... manually delete in Telegram ...
edit_result = await provider.edit_message(chat_id, result.message_id, "Edited")
assert not edit_result.success
```

---

## Risks & Considerations

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Telegram API changes | Low | Medium | Pin python-telegram-bot version; monitor changelog |
| Rate limiting on edits | Medium | Low | Implement exponential backoff in caller |
| Message edit race conditions | Low | Low | Not a concern for single-bot scenarios |

### Design Considerations

1. **Chunking behavior for edits**: When edited text exceeds 4096 chars, only the first chunk replaces the original message; additional chunks are new messages. This is a Telegram API limitation. Consider documenting this behavior prominently.

2. **Edit vs. Send new**: For long streaming responses, consider whether editing or sending new messages provides better UX. Editing can be disruptive if content changes significantly.

3. **Provider-specific options**: The `**kwargs` passthrough allows provider-specific options like `parse_mode="Markdown"`. Document common options.

4. **Message ID persistence**: Callers must persist message IDs if they want to edit messages later. Consider a message store in a future phase.

### Future Enhancements (Out of Scope)

- Message edit callbacks (detect when users edit their messages)
- Message deletion support
- Inline keyboard editing
- Edit history tracking
- Bulk message operations

---

## Checklist

- [x] Task 1.1: Add `provider_name` field to `IncomingMessage`
- [ ] Task 1.2: Add `supports_message_edit()` and `edit_message()` to `BaseMessagingProvider`
- [ ] Task 1.3: Implement editing in `TelegramProvider`
- [ ] Task 1.4: Set `provider_name` in `TelegramProvider._handle_message()`
- [ ] Unit tests pass
- [ ] Manual testing complete
- [ ] Code review approved- [x] Task 1.1: Add `provider_name` field to `IncomingMessage`
- [x] Task 1.2: Add `supports_message_edit()` and `edit_message()` to `BaseMessagingProvider`
- [x] Task 1.3: Implement editing in `TelegramProvider`
- [x] Task 1.4: Set `provider_name` in `TelegramProvider._handle_message()`
- [x] Unit tests pass
- [x] Manual testing complete
- [x] Code review approved

---

## Summary

Phase 1 adds foundational messaging capabilities with minimal changes:

1. **1 new field** in `IncomingMessage` (provider_name)
2. **2 new methods** in `BaseMessagingProvider` (supports_message_edit, edit_message)
3. **2 new methods** in `TelegramProvider` (supports_message_edit, edit_message)
4. **1 line change** in `TelegramProvider._handle_message()` (set provider_name)

Total estimated changes: ~60 lines of code including docstrings.
