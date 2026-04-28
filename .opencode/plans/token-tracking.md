# Plan: End-to-End Token Tracking

## Problem Statement

Token usage data from LLM calls is partially captured in the backend but is **not visible** in the database table, API responses, or frontend UI. The `total_tokens` column on the `conversations` table is always `0` (or may not exist if migration 008 was never applied), and per-message token usage stored in JSONB metadata is never aggregated or exposed.

### Root Causes

1. **Migration 008 likely never applied** — `scripts/migrate.sh` is hardcoded to run only migration `001`. No runner exists for 002–008.
2. **Python `Conversation` model ignores token fields** — `from_row()` and `to_dict()` don't include `total_tokens`, `summary`, or `summary_through_index`.
3. **Frontend types have no token fields** — `Conversation` TS interface lacks token data.
4. **Frontend SSE handler ignores `event: usage`** — No `onUsage` callback in `StreamCallbacks`.
5. **`get_conversation_token_usage()` is dead code** — Defined but never called from any route or service.
6. **Bot path discards usage** — `DeliveryResult.usage` is captured but never stored/logged.
7. **No user message token estimation** — Only assistant messages get usage metadata.

---

## Implementation Plan

### Phase 1: Database & Migration Foundation

**Goal:** Ensure the `total_tokens` column exists and migrations are reliably applied.

#### 1.1 Fix the migration script

- **File:** `scripts/migrate.sh`
- **Change:** Replace the hardcoded single-file approach with a loop that runs all migration files in `db/migrations/` in order.
- Track applied migrations in a `_migrations` table to make it idempotent.

#### 1.2 Add auto-migration on app startup (optional but recommended)

- **File:** `src/lib/services/postgres/db.py` (new method `run_pending_migrations`)
- **Change:** After `initialize()`, read `db/migrations/*.sql` files, check `_migrations` table, and run any unapplied ones.
- **Call site:** `src/apps/web/backend/state.py` → `init()` function, after `PostgresDB.initialize()`.
- **Alternative:** Keep it manual via `migrate.sh` only. Trade-off: simpler but requires remembering to run it.

#### 1.3 Verify migration 008

- Once the runner is in place, migration 008 (`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0`) will execute.
- Existing conversations will have `total_tokens = 0` by default.

---

### Phase 2: Backend Model & API Changes

**Goal:** Expose token data through the conversation model and API endpoints.

#### 2.1 Update `Conversation` dataclass

- **File:** `src/lib/services/conversation/models.py`
- **Changes:**
  ```
  @dataclass
  class Conversation:
      id: str
      title: str | None
      messages: list[ConversationMessage]
      created_at: datetime | None = None
      updated_at: datetime | None = None
      total_tokens: int = 0              # NEW
      summary: str | None = None         # NEW
      summary_through_index: int | None = None  # NEW
  ```
- Update `from_row()` to extract `total_tokens`, `summary`, `summary_through_index` from the DB row.
- Update `to_dict()` to include these fields in the serialized output.

#### 2.2 Wire `get_conversation_token_usage()` to an API endpoint

- **File:** `src/apps/web/backend/routes/conversations.py`
- **Add new route:**
  ```python
  @router.get("/{conversation_id}/token-usage")
  async def get_token_usage(conversation_id: str):
      """Get aggregated token usage for a conversation."""
      usage = await ConversationDB.get_conversation_token_usage(conversation_id)
      return {"conversation_id": conversation_id, **usage}
  ```

#### 2.3 Include `total_tokens` in conversation list responses

- **File:** `src/lib/services/conversation/db_client.py`
- **Change:** Update `list_conversations()` query to also select `total_tokens`:
  ```sql
  SELECT id, title, '[]'::jsonb AS messages, created_at, updated_at, total_tokens
  FROM conversations ORDER BY updated_at DESC LIMIT %s OFFSET %s
  ```

#### 2.4 Include `total_tokens` in single conversation GET

- Already works since `get_conversation()` uses `SELECT *`, but `Conversation.from_row()` needs to read it (covered by 2.1).

---

### Phase 3: Frontend — SSE Consumption

**Goal:** Frontend receives and stores per-response token usage via SSE.

#### 3.1 Add `onUsage` callback to `StreamCallbacks`

- **File:** `src/apps/web/frontend/src/services/streaming.ts`
- **Changes:**

  ```typescript
  export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  }

  interface StreamCallbacks {
    onText?: (chunk: string) => void;
    onAudio?: (audioBase64: string) => void;
    onComplete?: (audioChunkCount: number) => void;
    onError?: (error: string) => void;
    onConversationId?: (conversationId: string) => void;
    onUsage?: (usage: TokenUsage) => void; // NEW
  }
  ```

- Handle `event: usage` in the SSE parsing loop (around line 93):
  ```typescript
  else if (currentEvent === 'usage' && callbacks.onUsage && parsed.usage) {
    callbacks.onUsage(parsed.usage)
  }
  ```

#### 3.2 Add `lastUsage` to `ChatSlice` state

- **File:** `src/apps/web/frontend/src/store/chatSlice.ts`
- **Changes:**
  ```typescript
  export interface ChatSlice {
    messages: Message[];
    inputText: string;
    loading: boolean;
    conversationId: string | null;
    lastUsage: TokenUsage | null; // NEW
    setLastUsage: (usage: TokenUsage | null) => void; // NEW
    // ...existing methods
  }
  ```
- Wire `onUsage` callback in `handleSend()`:
  ```typescript
  onUsage: (usage) => {
    set({ lastUsage: usage });
  };
  ```
- Reset `lastUsage` in `handleNewChat()`.

---

### Phase 4: Frontend — Types & Display

**Goal:** Frontend types reflect backend data; token usage is visible in the UI.

#### 4.1 Update TypeScript types

- **File:** `src/apps/web/frontend/src/types/api.ts`
- **Changes:**
  ```typescript
  export interface Conversation {
    id: string;
    title: string | null;
    messages: ConversationMessage[];
    created_at: string | null;
    updated_at: string | null;
    total_tokens?: number; // NEW
    summary?: string | null; // NEW
  }
  ```

#### 4.2 Display token usage in ChatPanel

- **File:** `src/apps/web/frontend/src/lib/sections/chat/ChatPanel.tsx`
- **Change:** After each assistant message completes, show a subtle token count badge:
  ```tsx
  {
    msg.role === "assistant" && msg.metadata?.usage && (
      <span className="text-xs text-textSecondary">
        {msg.metadata.usage.total_tokens} tokens
      </span>
    );
  }
  ```
- This reads from the message metadata that's already stored (once the model serializes it).

#### 4.3 Show cumulative token usage in conversation header/sidebar (optional)

- **File:** `src/apps/web/frontend/src/lib/sections/layout/Sidebar.tsx`
- **Change:** Display `total_tokens` next to each conversation title.

---

### Phase 5: Bot Path — Persist Usage

**Goal:** Bot message handler stores token usage instead of discarding it.

#### 5.1 Log/store usage in bot message handler

- **File:** `src/apps/bot/message_handler.py`
- **Change:** After receiving `DeliveryResult`, log the usage:
  ```python
  if result.usage:
      printer.info(
          f"Token usage for conversation {result.conversation_id}: "
          f"{result.usage.get('input_tokens', 0)} in / "
          f"{result.usage.get('output_tokens', 0)} out / "
          f"{result.usage.get('total_tokens', 0)} total"
      )
  ```
- Note: Token tracking already happens via `_post_chat()` in `AIClient` since the bot uses `achat_stream()`. The usage in `DeliveryResult` is redundant for persistence but useful for logging.

---

### Phase 6: User Message Token Estimation (Optional Enhancement)

**Goal:** Estimate and store token counts for user messages too.

#### 6.1 Estimate input tokens

- **File:** `src/lib/services/ai_client/client.py`
- **Change:** In `achat()` and `achat_stream()`, before appending the user message, estimate tokens:
  ```python
  from .token_utils import count_tokens
  estimated_input_tokens = count_tokens(prompt, model=self.get_model_name())
  user_meta = {**meta, "usage": {"input_tokens": estimated_input_tokens}}
  ```
- This gives a rough estimate (not exact since it doesn't include history overhead).

---

## Execution Order

| Step | Files Changed                                                      | Depends On | Risk                  |
| ---- | ------------------------------------------------------------------ | ---------- | --------------------- |
| 1.1  | `scripts/migrate.sh`                                               | None       | Low                   |
| 1.2  | `src/lib/services/postgres/db.py`, `src/apps/web/backend/state.py` | 1.1        | Medium (startup time) |
| 2.1  | `src/lib/services/conversation/models.py`                          | 1.1        | Low                   |
| 2.2  | `src/apps/web/backend/routes/conversations.py`                     | 2.1        | Low                   |
| 2.3  | `src/lib/services/conversation/db_client.py`                       | 2.1        | Low                   |
| 3.1  | `src/apps/web/frontend/src/services/streaming.ts`                  | None       | Low                   |
| 3.2  | `src/apps/web/frontend/src/store/chatSlice.ts`                     | 3.1        | Low                   |
| 4.1  | `src/apps/web/frontend/src/types/api.ts`                           | 2.1        | Low                   |
| 4.2  | `src/apps/web/frontend/src/lib/sections/chat/ChatPanel.tsx`        | 3.2, 4.1   | Low                   |
| 5.1  | `src/apps/bot/message_handler.py`                                  | None       | Low                   |
| 6.1  | `src/lib/services/ai_client/client.py`                             | None       | Low                   |

---

## Files Changed (Summary)

| File                                                        | Change Type                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| `scripts/migrate.sh`                                        | Rewrite to run all migrations                                 |
| `src/lib/services/postgres/db.py`                           | Add `run_pending_migrations()`                                |
| `src/apps/web/backend/state.py`                             | Call `run_pending_migrations()` on startup                    |
| `src/lib/services/conversation/models.py`                   | Add `total_tokens`, `summary`, `summary_through_index` fields |
| `src/lib/services/conversation/db_client.py`                | Update `list_conversations` query to include `total_tokens`   |
| `src/apps/web/backend/routes/conversations.py`              | Add `GET /{id}/token-usage` endpoint                          |
| `src/apps/web/frontend/src/services/streaming.ts`           | Add `onUsage` callback, handle `event: usage`                 |
| `src/apps/web/frontend/src/store/chatSlice.ts`              | Add `lastUsage` state, wire `onUsage`                         |
| `src/apps/web/frontend/src/types/api.ts`                    | Add `total_tokens` to `Conversation`                          |
| `src/apps/web/frontend/src/lib/sections/chat/ChatPanel.tsx` | Display token badge per message                               |
| `src/apps/bot/message_handler.py`                           | Log usage from `DeliveryResult`                               |
| `src/lib/services/ai_client/client.py`                      | (Optional) Estimate input tokens for user messages            |

---

## Open Questions

1. **Auto-migration on startup vs manual only?** Auto-migration is safer (no missed migrations) but adds startup latency. Recommend auto with a `_migrations` tracking table.
2. **Token display granularity?** Show per-message tokens, cumulative per-conversation, or both? Recommend both — per-message in the chat panel, cumulative in the sidebar.
3. **Should `summary` be exposed to the frontend?** It's internal context management data. Recommend NOT exposing it to avoid confusion.
4. **Phase 6 (user message estimation)?** This adds noise since the estimate doesn't match actual billed tokens. Recommend skipping for now — actual usage is captured on assistant messages.
