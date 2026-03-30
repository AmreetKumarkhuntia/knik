# Bot App Architecture Overview

**Document Version:** 1.0
**Last Updated:** 2026-03-30
**Status:** Planning

---

## 1. Goals & Scope

### 1.1 Primary Goals

The Bot App (`src/apps/bot/`) is a long-running async daemon that serves as the **central orchestrator** between:

- **Messaging Providers** — Telegram (Phase 1), WhatsApp (future)
- **AI Services** — LLM with conversation lifecycle management
- **Conversation Persistence** — PostgreSQL-backed history
- **Tool Registry** — MCP tools for AI function calling

### 1.2 Key Objectives

| Objective | Description |
|-----------|-------------|
| **Non-blocking I/O** | Each incoming message spawns an isolated `asyncio.Task`; never blocks the event loop |
| **Per-chat concurrency guard** | Only one processing task per `chat_id` at any time; busy chats receive "Still thinking..." |
| **Cross-platform identity** | Same user on Telegram, WhatsApp, etc. shares a unified `user_id` and conversation history |
| **Provider-adaptive streaming** | Telegram: edit message in-place; others: send complete response |
| **Graceful degradation** | All DB/AI operations fail-safe; bot remains responsive even when dependencies are unavailable |

### 1.3 Scope

**In Scope:**
- Telegram provider integration with message editing
- User identity mapping across providers
- Streaming response management
- Non-blocking message handling with concurrency control
- Unified conversation persistence
- Integration with existing `AIClient`, `ConversationDB`, `MCPServerRegistry`

**Out of Scope (Future Phases):**
- WhatsApp provider implementation
- Webhook-based providers (currently long-polling only)
- Multi-tenant / SaaS deployment
- Rate limiting & quota management
- Admin commands (/start, /help, /reset)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BotApp (Daemon)                                 │
│                         src/apps/bot/app.py                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │  BotMessageHandler  │    │           StreamingResponseManager          │ │
│  │  message_handler.py │    │               streaming.py                  │ │
│  │                     │    │                                              │ │
│  │  • handle_message() │    │  • stream_response(chat_id, generator)      │ │
│  │  • _spawn_task()    │    │  • _edit_or_send(provider, ...)             │ │
│  │  • _active_tasks{}  │    │  • _send_busy_indicator()                  │ │
│  └──────────┬──────────┘    └──────────────────┬──────────────────────────┘ │
│             │                                  │                             │
│             │         ┌────────────────────────┘                             │
│             │         │                                                        │
│             ▼         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        MessagingClient                                   │ │
│  │              src/lib/services/messaging_client/                          │ │
│  │                                                                          │ │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────┐    │ │
│  │   │ TelegramProvider│   │  MockProvider   │   │ WhatsAppProvider  │    │ │
│  │   │  +edit_message()│   │                 │   │    (future)       │    │ │
│  │   └─────────────────┘   └─────────────────┘   └───────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        UserIdentityManager                               │ │
│  │                      src/apps/bot/user_identity.py                       │ │
│  │                                                                          │ │
│  │   get_or_create_user(provider, sender_id) → unified_user_id             │ │
│  │   get_conversation_id(user_id, chat_id) → conversation_id               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                              AIClient                                    │ │
│  │                 src/lib/services/ai_client/client.py                     │ │
│  │                                                                          │ │
│  │   • achat_stream(prompt, conversation_id, ...)                          │ │
│  │   • Conversation lifecycle: history, persistence, summarization         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────┐   ┌─────────────────────────────────────────┐ │
│  │      ConversationDB       │   │          MCPServerRegistry             │ │
│  │   (PostgreSQL Persistence)│   │        (Tool/Function Registry)        │ │
│  │                           │   │                                        │ │
│  │  • create_conversation()  │   │  • register_tool()                    │ │
│  │  • append_message()       │   │  • execute_tool()                     │ │
│  │  • get_recent_messages()  │   │  • create_langchain_tools()           │ │
│  └───────────────────────────┘   └────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                            BotConfig                                     │ │
│  │                      src/apps/bot/config.py                              │ │
│  │                                                                          │ │
│  │  Extends core Config with bot-specific settings                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Message Flow Diagram

```
┌──────────┐     ┌──────────────┐     ┌─────────────────────┐
│  User    │────▶│   Telegram   │────▶│   MessagingClient   │
│ (Mobile) │     │    Server    │     │ (TelegramProvider)  │
└──────────┘     └──────────────┘     └──────────┬──────────┘
                                                 │
                                                 │ IncomingMessage
                                                 │ (chat_id, text, sender_id, provider_name)
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              BotApp                                       │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                       BotMessageHandler                          │   │
│   │                                                                  │   │
│   │   1. Check _active_tasks[chat_id]                               │   │
│   │      ├─ If exists: send "Still thinking..." & return            │   │
│   │      └─ If empty: continue                                      │   │
│   │                                                                  │   │
│   │   2. UserIdentityManager.get_or_create_user(provider, sender_id)│   │
│   │      └─ Returns: unified_user_id                                │   │
│   │                                                                  │   │
│   │   3. UserIdentityManager.get_conversation_id(user_id, chat_id)  │   │
│   │      └─ Returns: conversation_id (creates if needed)            │   │
│   │                                                                  │   │
│   │   4. Spawn asyncio.Task:                                        │   │
│   │      ├─ Store task in _active_tasks[chat_id]                    │   │
│   │      └─ On completion: remove from _active_tasks                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Task (asyncio.Task)                           │   │
│   │                                                                  │   │
│   │   5. AIClient.achat_stream(prompt, conversation_id)             │   │
│   │      └─ Yields: text chunks + usage metadata                    │   │
│   │                                                                  │   │
│   │   6. StreamingResponseManager.stream_response(chat_id, chunks)  │   │
│   │      ├─ Check provider.supports_message_edit()                  │   │
│   │      ├─ If Telegram: edit_message() every N chunks              │   │
│   │      └─ If other: send_message() on completion                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              Data Flow                                    │
│                                                                           │
│   ConversationDB                  AIClient                     Messaging  │
│   ──────────────                  ────────                     ─────────  │
│                                                                           │
│   ┌─────────────┐    history    ┌─────────────┐   response   ┌─────────┐ │
│   │ get_recent_ │──────────────▶│ achat_stream│─────────────▶│ send_   │ │
│   │ messages()  │               │             │              │ message │ │
│   └─────────────┘               └─────────────┘              └─────────┘ │
│          ▲                            │                             │     │
│          │                            │ usage                       │     │
│          │                            ▼                             │     │
│          │                    ┌─────────────┐                       │     │
│          │                    │ MCPServer   │ (tool calls)          │     │
│          │                    │ Registry    │                       │     │
│          │                    └─────────────┘                       │     │
│          │                                                          │     │
│          │              append_message()                           │     │
│          └──────────────────────────────────────────────────────────┘     │
│                     (user + assistant messages persisted)                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Phase Summary

| Phase | Name | Description | Key Deliverables |
|-------|------|-------------|------------------|
| **1** | Messaging Infrastructure | Extend messaging layer for bot needs | `IncomingMessage.provider_name`, `BaseProvider.edit_message()`, `TelegramProvider.edit_message()` |
| **2** | Config & Identity | User identity mapping and bot config | `BotConfig`, `UserIdentityManager` |
| **3** | Streaming Response | Provider-adaptive streaming | `StreamingResponseManager` |
| **4** | Message Handler | Non-blocking processing with concurrency guard | `BotMessageHandler` |
| **5** | App Daemon & Entry | Main application and entry point | `BotApp`, `__init__.py`, `main.py --mode bot` |

---

## 5. File Map

### 5.1 New Files

| File | Purpose |
|------|---------|
| `src/apps/bot/__init__.py` | Package exports, version info |
| `src/apps/bot/config.py` | `BotConfig` — extends core config with bot settings |
| `src/apps/bot/app.py` | `BotApp` — main async daemon, lifecycle management |
| `src/apps/bot/message_handler.py` | `BotMessageHandler` — non-blocking message processing |
| `src/apps/bot/user_identity.py` | `UserIdentityManager` — cross-platform identity mapping |
| `src/apps/bot/streaming.py` | `StreamingResponseManager` — provider-adaptive streaming |

### 5.2 Modified Files

| File | Changes |
|------|---------|
| `src/lib/services/messaging_client/models.py` | Add `provider_name: str` field to `IncomingMessage` |
| `src/lib/services/messaging_client/providers/base_provider.py` | Add `supports_message_edit()` → `bool`, `edit_message(chat_id, message_id, text)` → `MessageResult` |
| `src/lib/services/messaging_client/providers/telegram_provider.py` | Implement `edit_message()` using Bot.edit_message_text() |
| `src/main.py` | Add `--mode bot` CLI flag, import and run `BotApp` |

---

## 6. Phase Dependencies

```
Phase 1: Messaging Infrastructure
    │
    ├──▶ Phase 2: Config & Identity (independent)
    │        │
    │        └──▶ Phase 3: Streaming Response
    │                  │
    └──────────────────┼──▶ Phase 4: Message Handler
                       │         │
                       └─────────┴──▶ Phase 5: App Daemon & Entry

Legend:
───▶  Depends on (must complete first)
```

### Detailed Dependencies

| Phase | Depends On | Rationale |
|-------|------------|-----------|
| **Phase 1** | None | Foundation layer; no bot dependencies |
| **Phase 2** | None | Config and identity are independent of messaging extensions |
| **Phase 3** | Phase 1 | Needs `supports_message_edit()` and `edit_message()` from providers |
| **Phase 4** | Phase 1, 2, 3 | Uses `IncomingMessage.provider_name`, `UserIdentityManager`, `StreamingResponseManager` |
| **Phase 5** | Phase 4 | Assembles all components into runnable daemon |

---

## 7. Component Specifications

### 7.1 BotApp (`app.py`)

```python
class BotApp:
    """Long-running async daemon orchestrating bot services."""

    def __init__(self, config: BotConfig):
        self.config = config
        self.messaging_client: MessagingClient
        self.ai_client: AIClient
        self.message_handler: BotMessageHandler
        self.identity_manager: UserIdentityManager
        self.mcp_registry: MCPServerRegistry

    async def start(self) -> None:
        """Initialize all services and start message listeners."""

    async def stop(self) -> None:
        """Graceful shutdown of all services."""

    async def run(self) -> None:
        """Main entry point; blocks until shutdown signal."""
```

### 7.2 BotMessageHandler (`message_handler.py`)

```python
class BotMessageHandler:
    """Non-blocking message processor with per-chat concurrency guard."""

    def __init__(self, ...):
        self._active_tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    async def handle_message(self, message: IncomingMessage) -> None:
        """
        Process incoming message.

        - If chat_id already has active task: send busy indicator
        - Otherwise: spawn new task for processing
        """

    async def _process_message(self, message: IncomingMessage) -> None:
        """
        Internal: actual message processing logic.

        1. Resolve user identity
        2. Get/create conversation
        3. Stream AI response
        4. Handle cleanup
        """
```

### 7.3 UserIdentityManager (`user_identity.py`)

```python
class UserIdentityManager:
    """Maps (provider, sender_id) → unified user_id for cross-platform sessions."""

    async def get_or_create_user(
        self,
        provider: str,
        sender_id: str,
        sender_name: str | None = None
    ) -> str:
        """
        Get or create unified user_id for provider:sender_id pair.
        Returns: unified_user_id (UUID)
        """

    async def get_conversation_id(
        self,
        user_id: str,
        chat_id: str,
        create_if_missing: bool = True
    ) -> str | None:
        """
        Get conversation_id for user+chat combination.
        Supports multiple chats per user with persistent history.
        """
```

### 7.4 StreamingResponseManager (`streaming.py`)

```python
class StreamingResponseManager:
    """Provider-adaptive streaming response handler."""

    def __init__(self, messaging_client: MessagingClient, config: BotConfig):
        self.messaging_client = messaging_client
        self.config = config

    async def stream_response(
        self,
        chat_id: str,
        provider_name: str,
        stream: AsyncGenerator[str, None],
        initial_message_id: str | None = None
    ) -> str:
        """
        Stream response with provider-adaptive behavior.

        - Telegram: edit message every N chunks
        - Others: accumulate and send complete

        Returns: final_message_id
        """
```

---

## 8. Database Schema Additions

### 8.1 User Identity Table

```sql
CREATE TABLE bot_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider        VARCHAR(50) NOT NULL,      -- 'telegram', 'whatsapp', etc.
    sender_id       VARCHAR(255) NOT NULL,     -- Provider-specific user ID
    unified_user_id UUID NOT NULL,             -- Cross-platform identity
    display_name    VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(provider, sender_id)
);

CREATE INDEX idx_bot_users_unified ON bot_users(unified_user_id);
```

### 8.2 Chat-User Mapping Table

```sql
CREATE TABLE bot_chat_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unified_user_id UUID NOT NULL REFERENCES bot_users(unified_user_id),
    provider        VARCHAR(50) NOT NULL,
    chat_id         VARCHAR(255) NOT NULL,
    conversation_id UUID REFERENCES conversations(id),
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(provider, chat_id)
);

CREATE INDEX idx_bot_chat_mappings_user ON bot_chat_mappings(unified_user_id);
CREATE INDEX idx_bot_chat_mappings_conversation ON bot_chat_mappings(conversation_id);
```

---

## 9. Out of Scope Items

| Item | Reason | Future Phase |
|------|--------|--------------|
| WhatsApp Provider | Requires Meta API integration | Phase 6 |
| Webhook Support | Current architecture uses long-polling | Phase 7 |
| Admin Commands (/start, /help) | Requires command handler framework | Phase 8 |
| Rate Limiting | Needs Redis/token bucket implementation | Phase 9 |
| Multi-tenant Deployment | Architecture redesign needed | Phase 10 |
| Push Notifications | Requires FCM/APNs integration | Future |
| Voice Message Support | Requires STT integration | Future |
| Inline Queries | Telegram-specific feature | Future |

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| `UserIdentityManager` | Identity creation, lookup, cross-provider mapping |
| `StreamingResponseManager` | Edit vs send logic, chunk accumulation |
| `BotMessageHandler` | Task spawning, concurrency guard, busy indicator |
| `BotConfig` | Config loading, defaults, validation |

### 10.2 Integration Tests

| Scenario | Description |
|----------|-------------|
| End-to-end message flow | Mock provider → handler → AI mock → response |
| Conversation persistence | Verify messages stored in correct conversation |
| Cross-platform identity | Same user on multiple providers shares conversation |
| Graceful degradation | Bot responds when DB/AI unavailable |

### 10.3 Test Files to Create

```
tests/
├── apps/
│   └── bot/
│       ├── __init__.py
│       ├── test_config.py
│       ├── test_user_identity.py
│       ├── test_streaming.py
│       ├── test_message_handler.py
│       └── test_app.py
├── lib/
│   └── services/
│       └── messaging_client/
│           ├── test_models.py          # provider_name field
│           └── providers/
│               └── test_telegram_provider.py  # edit_message
```

### 10.4 Mock Strategy

- **MockAIClient**: Use existing `MockAIClient` for deterministic responses
- **MockMessagingProvider**: Use existing `MockProvider` or extend with `edit_message` support
- **In-memory SQLite**: For `UserIdentityManager` and `ConversationDB` tests

---

## 11. Configuration Schema

```yaml
# Bot-specific configuration (extends core Config)
bot:
  # Streaming behavior
  streaming:
    edit_interval_ms: 500      # Telegram edit frequency
    chunk_buffer_size: 50      # Characters to buffer before edit

  # Concurrency
  concurrency:
    max_tasks_per_chat: 1      # Hard limit (always 1 for now)
    busy_indicator: "Still thinking..."
    busy_cooldown_ms: 5000     # Min time between busy messages

  # Identity
  identity:
    auto_create_users: true    # Create users on first message
    cross_platform_conversations: true  # Share history across providers
```

---

## 12. Error Handling Strategy

| Error Type | Handling |
|------------|----------|
| Provider send failure | Log error, retry with exponential backoff (max 3) |
| AI client timeout | Send "Request timed out" message, log details |
| DB unavailable | Continue with in-memory state, sync when recovered |
| Unknown provider | Log warning, ignore message |
| Message too long | Split into chunks (Telegram: 4096 chars) |

---

## 13. Monitoring & Observability

### 13.1 Metrics to Collect

- Messages received/processed per minute
- Average response latency
- Active conversations count
- Error rate by type
- Token usage per conversation

### 13.2 Logging

- Structured JSON logging with correlation IDs
- Per-message tracing (incoming → processing → response)
- Error stack traces with context

---

## 14. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Bot token exposure | Load from environment, never log |
| User data isolation | Validate chat_id ownership before operations |
| Rate limiting | Per-user message limits (future) |
| Input validation | Sanitize all incoming message content |
| SQL injection | Use parameterized queries (existing pattern) |

---

## 15. References

- [python-telegram-bot Documentation](https://docs.python-telegram-bot.org/)
- [AIClient Source](../../src/lib/services/ai_client/client.py)
- [ConversationDB Source](../../src/lib/services/conversation/db_client.py)
- [MessagingClient Source](../../src/lib/services/messaging_client/client.py)
- [MCPServerRegistry Source](../../src/lib/services/ai_client/registry/mcp_registry.py)
