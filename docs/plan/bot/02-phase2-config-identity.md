# Phase 2: Configuration & User Identity Management

## Overview

**Phase**: 2 of N
**Dependencies**: Phase 1 (Core Infrastructure - `IncomingMessage` model, provider registry)
**Estimated Effort**: 2-3 hours

### Purpose

Phase 2 establishes the configuration layer and user identity management for the Bot application. These components enable:

1. **BotConfig**: Environment-driven configuration for bot behavior (enabled providers, concurrency limits, system instructions)
2. **UserIdentityManager**: Cross-platform user identity resolution, allowing the same user to maintain a single conversation across Telegram, WhatsApp, and other providers

### Scope

| Component | File | Purpose |
|-----------|------|---------|
| BotConfig | `src/apps/bot/config.py` | Bot-specific configuration extending base `Config` |
| UserIdentityManager | `src/apps/bot/user_identity.py` | Cross-platform user identity resolution |

### Out of Scope (Future Phases)

- Database persistence for user identities
- Explicit `/link` command for manual account linking
- User authentication/authorization
- Multi-tenant isolation

---

## Dependencies on Phase 1

Phase 2 requires the following from Phase 1:

```python
# From src/lib/services/messaging_client/models.py
@dataclass
class IncomingMessage:
    chat_id: str
    text: str
    sender_id: str | None = None
    sender_name: str | None = None
    timestamp: float | None = None
    raw: dict[str, Any] = field(default_factory=dict)
```

**Assumed Phase 1 deliverables:**
- `IncomingMessage` dataclass exists and is importable
- Provider registry pattern established (for `bot_providers` validation)
- Base `Config` class from `src/lib/core/config.py`

---

## Task 2.1: BotConfig

### File: `src/apps/bot/config.py` (NEW)

```python
"""Bot application configuration."""

from dataclasses import dataclass, field
from typing import ClassVar

from lib.core.config import Config


@dataclass
class BotConfig(Config):
    """
    Configuration for Bot application.

    Extends base Config with bot-specific settings for multi-provider
    messaging bot operation.

    Environment Variables:
        KNIK_BOT_ENABLED: Enable/disable bot processing (default: True)
        KNIK_BOT_PROVIDERS: Comma-separated list of enabled providers (default: telegram)
        KNIK_BOT_SYSTEM_INSTRUCTION: Custom system instruction for bot conversations
        KNIK_BOT_CONCURRENT_LIMIT: Max concurrent message processing (default: 10)

    Example:
        >>> config = BotConfig()
        >>> config.bot_enabled
        True
        >>> config.bot_providers
        ['telegram']
    """

    DEFAULT_BOT_PROVIDERS: ClassVar[list[str]] = ["telegram"]
    DEFAULT_CONCURRENT_LIMIT: ClassVar[int] = 10

    bot_enabled: bool = field(
        default_factory=lambda: Config.from_env("KNIK_BOT_ENABLED", True, bool)
    )

    bot_providers: list[str] = field(
        default_factory=lambda: BotConfig._parse_providers()
    )

    bot_system_instruction: str | None = field(
        default_factory=lambda: Config.from_env("KNIK_BOT_SYSTEM_INSTRUCTION", None)
    )

    bot_concurrent_limit: int = field(
        default_factory=lambda: Config.from_env(
            "KNIK_BOT_CONCURRENT_LIMIT",
            BotConfig.DEFAULT_CONCURRENT_LIMIT,
            int
        )
    )

    @classmethod
    def _parse_providers(cls) -> list[str]:
        """
        Parse KNIK_BOT_PROVIDERS environment variable.

        Returns:
            List of provider names (lowercase, stripped).
            Returns default ['telegram'] if not set or empty.

        Example:
            KNIK_BOT_PROVIDERS="telegram,whatsapp" -> ['telegram', 'whatsapp']
            KNIK_BOT_PROVIDERS="" -> ['telegram']
        """
        raw = Config.from_env("KNIK_BOT_PROVIDERS", None)
        if not raw:
            return cls.DEFAULT_BOT_PROVIDERS.copy()

        providers = [p.strip().lower() for p in raw.split(",") if p.strip()]
        return providers if providers else cls.DEFAULT_BOT_PROVIDERS.copy()

    def is_provider_enabled(self, provider: str) -> bool:
        """Check if a specific provider is enabled."""
        return provider.lower() in self.bot_providers

    def get_effective_system_instruction(self) -> str:
        """
        Get the effective system instruction for bot conversations.

        Returns bot-specific instruction if set, otherwise falls back
        to base Config system_instruction.
        """
        if self.bot_system_instruction:
            return self.bot_system_instruction
        return self.system_instruction
```

### Implementation Notes

1. **Inheritance**: Extends `Config` to inherit all base configuration (AI settings, database, etc.)

2. **Provider Parsing**: The `_parse_providers()` classmethod handles:
   - Empty string → default `['telegram']`
   - Whitespace handling: `"telegram, whatsapp"` → `['telegram', 'whatsapp']`
   - Case normalization: `"Telegram, WHATSAPP"` → `['telegram', 'whatsapp']`

3. **System Instruction Priority**:
   - `KNIK_BOT_SYSTEM_INSTRUCTION` takes precedence
   - Falls back to `KNIK_AI_SYSTEM_INSTRUCTION` (from base Config)

4. **Concurrent Limit**: Used by the message processor (Phase 3) to limit concurrent LLM calls

### Thread-Safety

- `BotConfig` instances are immutable after creation (dataclass with no setters)
- Safe to share across async tasks
- Create once at application startup, pass by reference

### Environment Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `KNIK_BOT_ENABLED` | bool | `True` | Master switch for bot processing |
| `KNIK_BOT_PROVIDERS` | str | `telegram` | Comma-separated provider list |
| `KNIK_BOT_SYSTEM_INSTRUCTION` | str | `None` | Bot-specific system prompt |
| `KNIK_BOT_CONCURRENT_LIMIT` | int | `10` | Max concurrent message processing |

---

## Task 2.2: UserIdentityManager

### File: `src/apps/bot/user_identity.py` (NEW)

```python
"""User identity management for cross-platform conversation continuity."""

import uuid
from dataclasses import dataclass, field
from typing import Any

from lib.services.messaging_client.models import IncomingMessage


@dataclass
class UserIdentity:
    """
    Represents a resolved user identity.

    Attributes:
        user_id: Unified user identifier (UUID-based)
        provider: Source messaging provider
        sender_id: Provider-specific sender identifier
        conversation_id: Active conversation ID (if any)
        is_new: Whether this identity was just created
    """
    user_id: str
    provider: str
    sender_id: str
    conversation_id: str | None = None
    is_new: bool = False


class UserIdentityManager:
    """
    Manages cross-platform user identity resolution.

    Maps (provider, sender_id) tuples to unified user_ids, enabling
    conversation continuity across different messaging platforms.

    Design Goals:
        - Same user on Telegram and WhatsApp shares one conversation
        - Simple in-memory storage for v1
        - Thread-safe for async contexts

    v1 Limitations:
        - In-memory only (lost on restart)
        - No explicit linking commands
        - No persistence layer

    Future Enhancements:
        - Database persistence (PostgreSQL)
        - /link command for manual account linking
        - Identity merging/deduplication

    Example:
        >>> manager = UserIdentityManager()
        >>> identity = manager.resolve(incoming_message)
        >>> identity.user_id
        'usr_a1b2c3d4'
        >>> manager.set_conversation_id(identity.user_id, 'conv_xyz')
    """

    def __init__(self) -> None:
        """Initialize the identity manager with empty maps."""
        self._identity_map: dict[tuple[str, str], str] = {}
        self._user_conversations: dict[str, str | None] = {}
        self._user_metadata: dict[str, dict[str, Any]] = {}

    def resolve(self, incoming: IncomingMessage, provider: str) -> UserIdentity:
        """
        Resolve an incoming message to a unified user identity.

        Creates a new user_id if this (provider, sender_id) combination
        hasn't been seen before.

        Args:
            incoming: The incoming message from a provider
            provider: The provider name (e.g., 'telegram', 'whatsapp')

        Returns:
            UserIdentity with resolved user_id and conversation state

        Raises:
            ValueError: If sender_id is None

        Example:
            >>> msg = IncomingMessage(chat_id="123", text="hi", sender_id="456")
            >>> identity = manager.resolve(msg, "telegram")
            >>> identity.is_new
            True
        """
        if incoming.sender_id is None:
            raise ValueError(
                f"IncomingMessage from {provider} has no sender_id. "
                "Cannot resolve identity."
            )

        key = (provider.lower(), incoming.sender_id)

        if key in self._identity_map:
            user_id = self._identity_map[key]
            return UserIdentity(
                user_id=user_id,
                provider=provider,
                sender_id=incoming.sender_id,
                conversation_id=self._user_conversations.get(user_id),
                is_new=False,
            )

        user_id = self._generate_user_id()
        self._identity_map[key] = user_id
        self._user_conversations[user_id] = None
        self._user_metadata[user_id] = {
            "first_seen_provider": provider,
            "first_seen_at": incoming.timestamp,
            "sender_name": incoming.sender_name,
        }

        return UserIdentity(
            user_id=user_id,
            provider=provider,
            sender_id=incoming.sender_id,
            conversation_id=None,
            is_new=True,
        )

    def get_conversation_id(self, user_id: str) -> str | None:
        """
        Get the active conversation_id for a user.

        Args:
            user_id: The unified user identifier

        Returns:
            Active conversation_id or None if no active conversation
        """
        return self._user_conversations.get(user_id)

    def set_conversation_id(self, user_id: str, conversation_id: str) -> None:
        """
        Set the active conversation_id for a user.

        Args:
            user_id: The unified user identifier
            conversation_id: The conversation to set as active
        """
        self._user_conversations[user_id] = conversation_id

    def clear_conversation_id(self, user_id: str) -> None:
        """
        Clear the active conversation for a user.

        Called when a conversation is archived, deleted, or explicitly ended.

        Args:
            user_id: The unified user identifier
        """
        self._user_conversations[user_id] = None

    def get_user_metadata(self, user_id: str) -> dict[str, Any]:
        """
        Get metadata for a user.

        Args:
            user_id: The unified user identifier

        Returns:
            Dict with user metadata (first_seen, name, etc.)
        """
        return self._user_metadata.get(user_id, {})

    def get_stats(self) -> dict[str, Any]:
        """
        Get statistics for logging and debugging.

        Returns:
            Dict with identity manager statistics

        Example:
            >>> manager.get_stats()
            {
                'total_identities': 5,
                'active_conversations': 2,
                'providers': {'telegram': 3, 'whatsapp': 2}
            }
        """
        provider_counts: dict[str, int] = {}
        for (provider, _) in self._identity_map.keys():
            provider_counts[provider] = provider_counts.get(provider, 0) + 1

        active_conversations = sum(
            1 for conv_id in self._user_conversations.values()
            if conv_id is not None
        )

        return {
            "total_identities": len(self._identity_map),
            "active_conversations": active_conversations,
            "providers": provider_counts,
        }

    def _generate_user_id(self) -> str:
        """Generate a unique user identifier."""
        return f"usr_{uuid.uuid4().hex[:12]}"

    def link_identities(
        self,
        user_id: str,
        provider: str,
        sender_id: str
    ) -> None:
        """
        Link an additional (provider, sender_id) to an existing user.

        Used for manual account linking (future /link command support).

        Args:
            user_id: Existing unified user identifier
            provider: Provider to link
            sender_id: Sender ID on that provider

        Raises:
            ValueError: If user_id doesn't exist or key already mapped
        """
        if user_id not in self._user_conversations:
            raise ValueError(f"User {user_id} does not exist")

        key = (provider.lower(), sender_id)
        if key in self._identity_map:
            existing = self._identity_map[key]
            if existing != user_id:
                raise ValueError(
                    f"({provider}, {sender_id}) already linked to {existing}"
                )
            return

        self._identity_map[key] = user_id
```

### Internal Data Structures

```
_identity_map: dict[tuple[str, str], str]
    Key: (provider, sender_id)
    Value: unified user_id

    Example:
    {
        ('telegram', '123456789'): 'usr_a1b2c3d4',
        ('whatsapp', '987654321'): 'usr_a1b2c3d4',  # Same user!
        ('telegram', '555555555'): 'usr_e5f6g7h8',
    }

_user_conversations: dict[str, str | None]
    Key: user_id
    Value: active conversation_id or None

    Example:
    {
        'usr_a1b2c3d4': 'conv_xyz123',
        'usr_e5f6g7h8': None,
    }

_user_metadata: dict[str, dict[str, Any]]
    Key: user_id
    Value: metadata dict

    Example:
    {
        'usr_a1b2c3d4': {
            'first_seen_provider': 'telegram',
            'first_seen_at': 1711843200.0,
            'sender_name': 'John Doe',
        },
    }
```

### Implementation Notes

1. **User ID Format**: `usr_{uuid_hex_12_chars}` - readable and collision-resistant

2. **Provider Normalization**: Provider names are lowercased internally for consistent lookups

3. **Error Handling**: `resolve()` raises `ValueError` for messages without `sender_id` - callers should handle gracefully

4. **Memory Considerations**:
   - Each identity entry: ~100 bytes
   - 10,000 users: ~1 MB
   - Acceptable for v1 in-memory approach

### Thread-Safety (asyncio Context)

**Current Implementation**: Not thread-safe by default.

**Recommended Pattern for Async Usage**:

```python
import asyncio

class AsyncUserIdentityManager:
    """Thread-safe wrapper using asyncio.Lock."""

    def __init__(self) -> None:
        self._manager = UserIdentityManager()
        self._lock = asyncio.Lock()

    async def resolve(self, incoming: IncomingMessage, provider: str) -> UserIdentity:
        async with self._lock:
            return self._manager.resolve(incoming, provider)

    async def set_conversation_id(self, user_id: str, conv_id: str) -> None:
        async with self._lock:
            self._manager.set_conversation_id(user_id, conv_id)
```

**Alternative**: If using a single async event loop (typical for bots), the lock may not be strictly necessary since Python's GIL prevents true parallelism for CPU-bound operations. However, the lock is recommended for:
- Future multi-process deployment
- Explicit intent documentation
- Safer refactoring

---

## Testing Instructions

### Unit Tests: BotConfig

Create: `tests/apps/bot/test_config.py`

```python
import os
import pytest
from unittest.mock import patch

from apps.bot.config import BotConfig


class TestBotConfig:
    """Tests for BotConfig dataclass."""

    def test_default_values(self):
        """Test default configuration values."""
        config = BotConfig()
        assert config.bot_enabled is True
        assert config.bot_providers == ["telegram"]
        assert config.bot_system_instruction is None
        assert config.bot_concurrent_limit == 10

    @patch.dict(os.environ, {"KNIK_BOT_ENABLED": "false"})
    def test_bot_enabled_false(self):
        """Test KNIK_BOT_ENABLED=false parsing."""
        config = BotConfig()
        assert config.bot_enabled is False

    @patch.dict(os.environ, {"KNIK_BOT_PROVIDERS": "telegram,whatsapp,discord"})
    def test_providers_parsing(self):
        """Test comma-separated providers parsing."""
        config = BotConfig()
        assert config.bot_providers == ["telegram", "whatsapp", "discord"]

    @patch.dict(os.environ, {"KNIK_BOT_PROVIDERS": "  Telegram , WHATSAPP  "})
    def test_providers_whitespace_handling(self):
        """Test provider name whitespace and case handling."""
        config = BotConfig()
        assert config.bot_providers == ["telegram", "whatsapp"]

    @patch.dict(os.environ, {"KNIK_BOT_PROVIDERS": ""})
    def test_providers_empty_string_uses_default(self):
        """Test empty KNIK_BOT_PROVIDERS uses default."""
        config = BotConfig()
        assert config.bot_providers == ["telegram"]

    @patch.dict(os.environ, {"KNIK_BOT_CONCURRENT_LIMIT": "25"})
    def test_concurrent_limit_override(self):
        """Test KNIK_BOT_CONCURRENT_LIMIT override."""
        config = BotConfig()
        assert config.bot_concurrent_limit == 25

    @patch.dict(os.environ, {"KNIK_BOT_SYSTEM_INSTRUCTION": "You are a helpful bot."})
    def test_system_instruction_override(self):
        """Test KNIK_BOT_SYSTEM_INSTRUCTION override."""
        config = BotConfig()
        assert config.bot_system_instruction == "You are a helpful bot."

    def test_is_provider_enabled(self):
        """Test is_provider_enabled helper method."""
        config = BotConfig()
        assert config.is_provider_enabled("telegram") is True
        assert config.is_provider_enabled("TELEGRAM") is True
        assert config.is_provider_enabled("whatsapp") is False

    def test_get_effective_system_instruction_fallback(self):
        """Test system instruction fallback to base Config."""
        config = BotConfig()
        effective = config.get_effective_system_instruction()
        assert effective == config.system_instruction
```

### Unit Tests: UserIdentityManager

Create: `tests/apps/bot/test_user_identity.py`

```python
import pytest
import time

from apps.bot.user_identity import UserIdentity, UserIdentityManager
from lib.services.messaging_client.models import IncomingMessage


class TestUserIdentityManager:
    """Tests for UserIdentityManager."""

    @pytest.fixture
    def manager(self) -> UserIdentityManager:
        return UserIdentityManager()

    @pytest.fixture
    def telegram_message(self) -> IncomingMessage:
        return IncomingMessage(
            chat_id="tg_chat_123",
            text="Hello",
            sender_id="tg_user_456",
            sender_name="Telegram User",
            timestamp=time.time(),
        )

    @pytest.fixture
    def whatsapp_message(self) -> IncomingMessage:
        return IncomingMessage(
            chat_id="wa_chat_789",
            text="Hi",
            sender_id="wa_user_012",
            sender_name="WhatsApp User",
            timestamp=time.time(),
        )

    def test_resolve_new_identity(self, manager, telegram_message):
        """Test resolving a new user identity."""
        identity = manager.resolve(telegram_message, "telegram")

        assert identity.is_new is True
        assert identity.user_id.startswith("usr_")
        assert identity.provider == "telegram"
        assert identity.sender_id == "tg_user_456"
        assert identity.conversation_id is None

    def test_resolve_existing_identity(self, manager, telegram_message):
        """Test resolving an existing identity returns same user_id."""
        identity1 = manager.resolve(telegram_message, "telegram")
        identity2 = manager.resolve(telegram_message, "telegram")

        assert identity1.is_new is True
        assert identity2.is_new is False
        assert identity1.user_id == identity2.user_id

    def test_resolve_without_sender_id_raises(self, manager):
        """Test that missing sender_id raises ValueError."""
        msg = IncomingMessage(chat_id="123", text="hi", sender_id=None)

        with pytest.raises(ValueError, match="no sender_id"):
            manager.resolve(msg, "telegram")

    def test_provider_case_insensitive(self, manager, telegram_message):
        """Test provider names are normalized to lowercase."""
        identity1 = manager.resolve(telegram_message, "Telegram")
        identity2 = manager.resolve(telegram_message, "TELEGRAM")

        assert identity1.user_id == identity2.user_id

    def test_different_providers_different_users(self, manager, telegram_message, whatsapp_message):
        """Test different providers create different users by default."""
        # Same sender_id but different providers
        whatsapp_message.sender_id = telegram_message.sender_id

        id_telegram = manager.resolve(telegram_message, "telegram")
        id_whatsapp = manager.resolve(whatsapp_message, "whatsapp")

        assert id_telegram.user_id != id_whatsapp.user_id

    def test_conversation_id_management(self, manager, telegram_message):
        """Test conversation ID get/set operations."""
        identity = manager.resolve(telegram_message, "telegram")

        assert manager.get_conversation_id(identity.user_id) is None

        manager.set_conversation_id(identity.user_id, "conv_abc123")
        assert manager.get_conversation_id(identity.user_id) == "conv_abc123"

        manager.clear_conversation_id(identity.user_id)
        assert manager.get_conversation_id(identity.user_id) is None

    def test_conversation_reflected_in_resolve(self, manager, telegram_message):
        """Test that resolve returns current conversation_id."""
        identity1 = manager.resolve(telegram_message, "telegram")
        manager.set_conversation_id(identity1.user_id, "conv_xyz")

        identity2 = manager.resolve(telegram_message, "telegram")
        assert identity2.conversation_id == "conv_xyz"

    def test_get_stats(self, manager, telegram_message, whatsapp_message):
        """Test statistics reporting."""
        manager.resolve(telegram_message, "telegram")
        manager.resolve(whatsapp_message, "whatsapp")

        user_id = manager.resolve(telegram_message, "telegram").user_id
        manager.set_conversation_id(user_id, "conv_1")

        stats = manager.get_stats()

        assert stats["total_identities"] == 2
        assert stats["active_conversations"] == 1
        assert stats["providers"] == {"telegram": 1, "whatsapp": 1}

    def test_link_identities(self, manager, telegram_message, whatsapp_message):
        """Test manual identity linking."""
        tg_identity = manager.resolve(telegram_message, "telegram")

        manager.link_identities(
            tg_identity.user_id,
            "whatsapp",
            whatsapp_message.sender_id
        )

        wa_identity = manager.resolve(whatsapp_message, "whatsapp")
        assert wa_identity.user_id == tg_identity.user_id
        assert wa_identity.is_new is False

    def test_link_identities_nonexistent_user_raises(self, manager, whatsapp_message):
        """Test linking to nonexistent user raises."""
        with pytest.raises(ValueError, match="does not exist"):
            manager.link_identities("usr_nonexistent", "whatsapp", "123")

    def test_link_identities_already_linked_raises(self, manager, telegram_message, whatsapp_message):
        """Test linking already-linked identity raises."""
        tg_identity = manager.resolve(telegram_message, "telegram")
        wa_identity = manager.resolve(whatsapp_message, "whatsapp")

        with pytest.raises(ValueError, match="already linked"):
            manager.link_identities(tg_identity.user_id, "whatsapp", wa_identity.sender_id)

    def test_user_metadata(self, manager, telegram_message):
        """Test user metadata storage."""
        identity = manager.resolve(telegram_message, "telegram")
        metadata = manager.get_user_metadata(identity.user_id)

        assert metadata["first_seen_provider"] == "telegram"
        assert metadata["sender_name"] == "Telegram User"
        assert metadata["first_seen_at"] == telegram_message.timestamp
```

### Running Tests

```bash
# Run all bot tests
pytest tests/apps/bot/ -v

# Run with coverage
pytest tests/apps/bot/ -v --cov=src/apps/bot --cov-report=term-missing

# Run specific test file
pytest tests/apps/bot/test_user_identity.py -v
```

---

## Future Enhancements

### Database Persistence (Phase N)

**Goal**: Survive restarts and scale horizontally.

**Schema**:

```sql
CREATE TABLE user_identities (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    sender_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, sender_id)
);

CREATE INDEX idx_user_identities_user ON user_identities(user_id);

CREATE TABLE user_conversations (
    user_id VARCHAR(32) PRIMARY KEY,
    conversation_id VARCHAR(64),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Implementation**:

```python
class PersistentUserIdentityManager(UserIdentityManager):
    def __init__(self, db_client: DatabaseClient):
        self._db = db_client
        # Optional: in-memory cache with TTL

    async def resolve(self, incoming: IncomingMessage, provider: str) -> UserIdentity:
        # 1. Check cache
        # 2. Query database
        # 3. Create if not exists
        # 4. Update cache
        pass
```

### /link Command (Phase N)

**Goal**: Allow users to explicitly link accounts across providers.

**Flow**:
1. User sends `/link` on Telegram
2. Bot generates a one-time code: `LINK-ABC123`
3. User sends `/link LINK-ABC123` on WhatsApp
4. Both accounts now share the same `user_id`

**Implementation Sketch**:

```python
class LinkCodeManager:
    _pending_links: dict[str, str]  # code -> user_id
    _code_ttl: int = 300  # 5 minutes

    def generate_link_code(self, user_id: str) -> str:
        code = f"LINK-{secrets.token_hex(6).upper()}"
        self._pending_links[code] = user_id
        return code

    def redeem_link_code(self, code: str, new_provider: str, new_sender_id: str) -> str | None:
        if code not in self._pending_links:
            return None
        user_id = self._pending_links.pop(code)
        # Link the new identity
        return user_id
```

---

## Checklist

- [ ] Create `src/apps/bot/__init__.py` (empty or with exports)
- [ ] Create `src/apps/bot/config.py` with `BotConfig` dataclass
- [ ] Create `src/apps/bot/user_identity.py` with `UserIdentityManager`
- [ ] Create `tests/apps/bot/__init__.py`
- [ ] Create `tests/apps/bot/test_config.py`
- [ ] Create `tests/apps/bot/test_user_identity.py`
- [ ] Run tests: `pytest tests/apps/bot/ -v`
- [ ] Run linting: `ruff check src/apps/bot/`
- [ ] Run type checking: `pyright src/apps/bot/`

---

## File Summary

| File | Lines (est.) | Status |
|------|--------------|--------|
| `src/apps/bot/__init__.py` | 5 | NEW |
| `src/apps/bot/config.py` | 80 | NEW |
| `src/apps/bot/user_identity.py` | 180 | NEW |
| `tests/apps/bot/__init__.py` | 0 | NEW |
| `tests/apps/bot/test_config.py` | 80 | NEW |
| `tests/apps/bot/test_user_identity.py` | 150 | NEW |

**Total**: ~500 lines of production code + tests
