# Dynamic Model Discovery, Token Tracking & Context Summarization

**Status:** Planning
**Last Updated:** March 2026

This document describes the design and implementation plan for three interconnected features: dynamic model discovery from provider APIs, per-call token usage tracking, and automatic context summarization when conversations approach model context limits.

---

## Current State

### Model Discovery -- Static

Models are defined in a hardcoded dictionary in `src/lib/core/config.py` (`Config.AI_MODELS`, lines 96-109). This dict maps 12 model IDs to display names. The admin API endpoint `GET /models` returns this static dict directly.

No provider has a `list_models()` or `get_models()` method. The active model is set via the `KNIK_AI_MODEL` environment variable or switched at runtime through the console `/model` command or web settings panel -- but the available options always come from the static dict.

### Token Tracking -- None

There is zero token counting anywhere in the codebase. No imports of `tiktoken`, no references to `usage_metadata`, `response_metadata`, `get_num_tokens`, or `count_tokens`.

LangChain response objects already contain token usage data:
- **Non-streaming:** `AIMessage.usage_metadata` returns `{input_tokens, output_tokens, total_tokens}`
- **Streaming:** The final `AIMessageChunk` contains `usage_metadata`

This data is discarded in `base_provider.py`. The `chat()` method does `result = self.llm.invoke(messages)` then immediately returns `result.content`, throwing away all metadata. The `chat_stream()` method yields `chunk.content` strings and never inspects the final chunk's metadata.

`ConversationMessage.metadata` is a dict that currently stores `{provider, model, audio_chunks}`. It lives in a JSONB column in PostgreSQL -- no migration is needed to extend it with usage data.

### Context Management -- Fixed Sliding Window

The conversation history system uses a fixed sliding window of the last 5 turns (`history_context_size=5`), sent verbatim to the LLM. There is:

- No awareness of model context window sizes
- No token counting of outgoing context
- No summarization or compression
- No use of LangChain memory classes

The `ConversationHistory` class (in-memory) and `ConversationDB` (PostgreSQL with JSONB messages) store full conversation data, but the context sent to the LLM is always just the last N turns regardless of their token size.

The database schema has no `summary` column -- a migration is needed for Part 3.

---

## Part 1: Dynamic Model Discovery

### Goal

Each provider exposes a `get_models()` method that queries its API for available models. If the API call fails, fall back to `Config.AI_MODELS`. This is "dynamic with static fallback."

For now, only the core `get_models()` method is implemented. Admin API, console commands, and frontend selectors are updated in a later phase.

### Design

#### Abstract Method on BaseAIProvider

Add to `src/lib/services/ai_client/providers/base_provider.py`:

- `get_models() -> list[dict]` -- abstract method, each provider implements
- `get_models_with_fallback() -> list[dict]` -- concrete method that tries `get_models()`, catches exceptions, falls back to filtering `Config.AI_MODELS` for that provider

Each model dict follows this schema:

```
{
    "id": "gemini-2.0-flash",
    "name": "Gemini 2.0 Flash",
    "context_window": 1048576,
    "provider": "vertex"
}
```

### Per-Provider Implementation

| Provider | File | API Source | Auth |
|----------|------|-----------|------|
| Vertex | `vertex_provider.py` | Google Cloud `aiplatform` SDK or REST `GET /v1/models` | Service account (already configured) |
| Gemini | `gemini_provider.py` | REST `GET https://generativelanguage.googleapis.com/v1beta/models?key={key}` | API key from env |
| ZAI | `zai_provider.py` | OpenAI-compatible `GET {base_url}/models` | Bearer token from env |
| ZAI Coding | `zai_coding_provider.py` | Same as ZAI, different base URL | Bearer token from env |
| Custom | `custom_provider.py` | OpenAI-compatible `GET {base_url}/models` | Bearer token from env |
| ZhipuAI | `zhipuai_provider.py` | REST `GET https://open.bigmodel.cn/api/paas/v4/models` | API key from env |
| Mock | `mock_provider.py` | Returns static hardcoded list | None |

All implementations:
- Use `httpx` or `requests` with a short timeout (5 seconds, configurable via `Config.MODEL_DISCOVERY_TIMEOUT`)
- Wrap the API call in try/except, returning `[]` on failure
- The fallback layer in `get_models_with_fallback()` handles the empty-list case

### AIClient Integration

Add to `src/lib/services/ai_client/client.py`:

- `list_models_for_provider(provider_name: str) -> list[dict]` -- instantiates the provider, calls `get_models_with_fallback()`
- `list_all_models() -> dict[str, list[dict]]` -- iterates all registered providers, aggregates results

### Config Changes

In `src/lib/core/config.py`:
- `Config.AI_MODELS` stays as-is -- becomes the fallback source
- Add `Config.MODEL_DISCOVERY_TIMEOUT = 5` (seconds)

### Deferred (Later Phase)

- Admin API `GET /models` endpoint -- switch from static dict to `AIClient.list_all_models()`
- Console `/model` command -- show dynamically discovered models
- Frontend model selector -- populate from API instead of hardcoded list
- GUI settings panel model picker

---

## Part 2: Token Tracking

### Goal

Capture input/output/total tokens for every LLM call from LangChain's already-returned `usage_metadata`. Store in `ConversationMessage.metadata`. Expose for consumption by console, web, and (later) frontend.

### Design

#### ChatResult Dataclass

Add to `base_provider.py` (or a new `types.py` in the providers package):

```
ChatResult:
    content: str
    usage: dict | None    # {input_tokens, output_tokens, total_tokens}
```

#### Non-Streaming (chat)

Current flow in `base_provider.py`:
```
result = self.llm.invoke(messages)
return result.content              # metadata discarded
```

New flow:
```
result = self.llm.invoke(messages)
self.last_usage = result.usage_metadata
return ChatResult(content=result.content, usage=result.usage_metadata)
```

#### Streaming (chat_stream)

Current flow:
```
for chunk in self.llm.stream(messages):
    yield chunk.content             # final chunk metadata discarded
```

New flow:
```
for chunk in self.llm.stream(messages):
    yield chunk.content
    last_chunk = chunk
self.last_usage = last_chunk.usage_metadata
```

The caller accesses `provider.last_usage` after stream iteration completes. This is stored as an instance attribute because Python generators cannot return values to the caller through the iteration protocol in a way that's ergonomic for SSE streaming.

### Storage

Extend `ConversationMessage.metadata` with a `usage` key. No migration needed -- metadata is already a JSONB column.

After each LLM call, the metadata dict becomes:

```json
{
    "provider": "vertex",
    "model": "gemini-2.0-flash",
    "usage": {
        "input_tokens": 1250,
        "output_tokens": 340,
        "total_tokens": 1590
    }
}
```

Add to `src/lib/services/conversation/db_client.py`:
- `get_conversation_token_usage(conversation_id) -> dict` -- sums all `metadata.usage` across messages in a conversation, returns `{total_input, total_output, total}`

### Integration Points

**`src/apps/web/backend/routes/chat_stream.py`:**
- After the stream completes, read `provider.last_usage`
- Store in the assistant message's metadata
- Optionally emit a `usage` SSE event (for frontend consumption in later phase)

**`src/apps/web/backend/routes/chat.py`:**
- After `AIClient.chat()`, read usage from `ChatResult`
- Store in the assistant message's metadata

**`src/apps/console/app.py`:**
- After each response, if usage data is available, display:
  `[tokens: 1250 in / 340 out / 1590 total]`

### Dependencies

- `tiktoken` added to `requirements.txt` -- used in Part 3 for pre-call token estimation, not for post-call counting (LangChain handles that via provider APIs)

---

## Part 3: Context Summarization

### Goal

When a conversation's token count approaches the model's context window limit (70-80%), automatically summarize earlier messages to compress context. The summarizer lives at the `AIClient` level, making it model-agnostic and reusable across all providers.

### Design

#### ConversationSummarizer Class

New file: `src/lib/services/conversation/summarizer.py`

This is the core orchestrator. It does NOT live in any provider -- it uses `AIClient` to call whatever provider/model is currently active.

#### Flow

```
New user message arrives
        |
        v
Gather context:
  [existing summary (if any)] + [messages after summary_through_index] + [new message]
        |
        v
Count tokens of full context (tiktoken)
        |
        v
Get model's context window size (from provider)
        |
        +------ token_count < (context_window * 0.70) ------> No action, proceed normally
        |
        +------ token_count >= (context_window * 0.70) -----> Trigger summarization
                    |
                    v
              Select messages to summarize:
              From (summary_through_index + 1) to (current - 2)
              Keep last 2 turn pairs unsummarized for coherence
                    |
                    v
              Build summarization prompt:
              "Summarize this conversation concisely, preserving
               key facts, decisions, user preferences, and any
               code/technical details. Previous summary: {existing}"
                    |
                    v
              Call AIClient.chat() with summarization prompt
              (uses same provider's LLM)
                    |
                    v
              Store new summary + updated through_index in DB
                    |
                    v
              Rebuild context:
              [summary as system message] + [recent messages] + [new message]
                    |
                    v
              Proceed with condensed context
```

### Trigger Logic

- Threshold: configurable, default 75% of model's context window (`SUMMARIZATION_THRESHOLD = 0.75`)
- Token counting: `tiktoken` for pre-call estimation
- Tool call tokens: included in the count -- tool call messages (`ToolMessage`, `AIMessage` with `tool_calls`) are counted like any other message
- For models without a tiktoken encoding (e.g., Gemini), fall back to `cl100k_base` encoding (reasonable approximation)

Token counting utilities live in a new file: `src/lib/services/ai_client/token_utils.py`

- `count_tokens(text: str, model: str) -> int` -- count tokens for a string
- `count_message_tokens(messages: list[dict], model: str) -> int` -- count tokens for a message list, accounting for message formatting overhead and tool call content

### Summarization Strategy

**Same provider's LLM:** Summarization calls use the same provider and model that the conversation is using. No separate lightweight model.

**Cumulative summaries:** Each new summary incorporates the previous one. The summarization prompt includes the existing summary so context is never lost, only compressed.

**Keep recent turns:** The last 2 turn pairs (user + assistant) are always kept verbatim and never summarized. This preserves conversational coherence and immediate context.

**Prompt template:**

```
You are summarizing a conversation between a user and an AI assistant.
Produce a concise summary that preserves:
- Key facts and information discussed
- Decisions made and preferences expressed
- Technical details, code snippets, and specific values mentioned
- The current topic and direction of conversation
- Any outstanding questions or tasks

{if existing_summary}
Previous summary of earlier conversation:
{existing_summary}
{end}

Conversation to summarize:
{messages}

Summary:
```

### Context Window Registry

Add `get_context_window(model: str) -> int` to `base_provider.py`:
- Each provider knows its model's context window from the `get_models()` response (Part 1) or a static mapping
- Fallback: conservative default of 8,192 tokens if the model is unknown

### Database Migration

New file: `db/migrations/008_add_conversation_summary.sql`

```sql
ALTER TABLE conversations ADD COLUMN summary TEXT;
ALTER TABLE conversations ADD COLUMN summary_through_index INTEGER;
```

- `summary` -- the compressed summary text (null if no summarization has occurred)
- `summary_through_index` -- the message index up to which the summary covers, so we know which messages are already summarized (null if no summarization)

### DB Client Updates

Add to `src/lib/services/conversation/db_client.py`:
- `get_summary(conversation_id) -> tuple[str | None, int | None]` -- returns (summary, through_index)
- `update_summary(conversation_id, summary: str, through_index: int)` -- upserts the summary columns

### AIClient Integration

In `src/lib/services/ai_client/client.py`, before every `chat()` / `chat_stream()` call:

1. Instantiate `ConversationSummarizer`
2. Call `summarizer.prepare_context(conversation_id, new_message, provider, model)`
3. This returns the optimized message list (with summary injected as a system message if needed)
4. Pass this to the provider instead of raw history

### Config Additions

In `src/lib/core/config.py`:
- `SUMMARIZATION_THRESHOLD = 0.75` -- trigger at 75% of context window
- `SUMMARIZATION_KEEP_RECENT = 2` -- number of recent turn pairs to keep unsummarized
- `SUMMARIZATION_ENABLED = True` -- feature flag to disable summarization

---

## File Change Manifest

### Files to Modify

| File | Changes | Part |
|------|---------|------|
| `src/lib/services/ai_client/providers/base_provider.py` | Add `get_models()` abstract, `get_models_with_fallback()`, `get_context_window()`, `ChatResult` dataclass, capture `usage_metadata` in `chat()`/`chat_stream()`, add `last_usage` attribute | 1, 2, 3 |
| `src/lib/services/ai_client/providers/vertex_provider.py` | Implement `get_models()` | 1 |
| `src/lib/services/ai_client/providers/gemini_provider.py` | Implement `get_models()` | 1 |
| `src/lib/services/ai_client/providers/zai_provider.py` | Implement `get_models()` | 1 |
| `src/lib/services/ai_client/providers/zai_coding_provider.py` | Implement `get_models()` | 1 |
| `src/lib/services/ai_client/providers/zhipuai_provider.py` | Implement `get_models()` | 1 |
| `src/lib/services/ai_client/providers/custom_provider.py` | Implement `get_models()` | 1 |
| `src/lib/services/ai_client/providers/mock_provider.py` | Implement `get_models()` with static mock data | 1 |
| `src/lib/services/ai_client/client.py` | Add `list_models_for_provider()`, `list_all_models()`, `get_last_usage()`, integrate summarizer before calls | 1, 2, 3 |
| `src/lib/services/conversation/db_client.py` | Add `get_conversation_token_usage()`, `get_summary()`, `update_summary()` | 2, 3 |
| `src/lib/core/config.py` | Add `MODEL_DISCOVERY_TIMEOUT`, `SUMMARIZATION_THRESHOLD`, `SUMMARIZATION_KEEP_RECENT`, `SUMMARIZATION_ENABLED` | 1, 3 |
| `src/apps/web/backend/routes/chat_stream.py` | Capture and store token usage after stream, integrate summarizer | 2, 3 |
| `src/apps/web/backend/routes/chat.py` | Capture and store token usage | 2 |
| `src/apps/console/app.py` | Display token usage after responses | 2 |
| `requirements.txt` | Add `tiktoken` | 2, 3 |

### Files to Create

| File | Purpose | Part |
|------|---------|------|
| `src/lib/services/ai_client/token_utils.py` | `count_tokens()`, `count_message_tokens()` using tiktoken | 3 |
| `src/lib/services/conversation/summarizer.py` | `ConversationSummarizer` class -- context preparation and summarization orchestration | 3 |
| `db/migrations/008_add_conversation_summary.sql` | Add `summary` and `summary_through_index` columns to conversations table | 3 |

---

## Execution Order

| Step | Task | Depends On | Part |
|------|------|-----------|------|
| 1 | Add `tiktoken` to `requirements.txt` | -- | 2, 3 |
| 2 | Create `token_utils.py` with token counting functions | Step 1 | 3 |
| 3 | Add `ChatResult` dataclass to `base_provider.py` | -- | 2 |
| 4 | Modify `base_provider.py` -- add `get_models()` abstract, `get_models_with_fallback()`, `get_context_window()`, capture `usage_metadata`, add `last_usage` | Step 3 | 1, 2, 3 |
| 5 | Implement `get_models()` in all 7 providers | Step 4 | 1 |
| 6 | Update `AIClient` -- `list_models_for_provider()`, `list_all_models()`, usage propagation | Steps 4, 5 | 1, 2 |
| 7 | Update `db_client.py` -- store usage in metadata, add `get_conversation_token_usage()` | Step 4 | 2 |
| 8 | Update `chat_stream.py` and `chat.py` -- integrate token tracking | Steps 6, 7 | 2 |
| 9 | Update console `app.py` -- display token usage | Step 6 | 2 |
| 10 | Run migration `008_add_conversation_summary.sql` | -- | 3 |
| 11 | Update `db_client.py` -- add `get_summary()`, `update_summary()` | Step 10 | 3 |
| 12 | Create `summarizer.py` -- `ConversationSummarizer` class | Steps 2, 11 | 3 |
| 13 | Integrate summarizer into `AIClient` before `chat()`/`chat_stream()` | Step 12 | 3 |
| 14 | Add summarization config values to `config.py` | -- | 3 |
| 15 | End-to-end testing | All above | -- |

---

## Testing Strategy

### Unit Tests

- **Token counting:** Verify `count_tokens()` and `count_message_tokens()` produce accurate counts against known inputs
- **Summarizer logic:** Mock the provider and verify summarization triggers at the correct threshold, keeps the right number of recent turns, and produces cumulative summaries
- **get_models():** Mock HTTP responses for each provider, verify parsing and fallback behavior
- **ChatResult:** Verify usage metadata is correctly extracted from LangChain response objects

### Integration Tests

- **Full chat flow with token tracking:** Send a message through `AIClient`, verify usage data appears in `ConversationMessage.metadata`
- **Summarization trigger:** Build a conversation that exceeds the threshold, verify the summarizer fires and the summary is stored in DB
- **Model discovery with fallback:** Test with a provider whose API is unreachable, verify fallback to `Config.AI_MODELS`

### Manual Testing

- **Console app:** Have a multi-turn conversation, verify token counts display after each response
- **Context limit:** Have a long conversation that approaches the context window, verify summarization kicks in and the conversation continues coherently
- **Web app:** Verify token tracking data flows through SSE events (once frontend integration is done)

---

## Deferred Work (Later Phase)

These items depend on the core infrastructure above but are not part of this implementation phase:

- **Admin API:** Update `GET /models` to use `AIClient.list_all_models()` instead of static `Config.AI_MODELS`
- **Console `/model` command:** Show dynamically discovered models instead of static list
- **Frontend model selector:** Populate from dynamic API response
- **GUI settings panel:** Update model picker to use dynamic models
- **Frontend token display:** Show token usage per message in the web chat UI
- **Frontend SSE `usage` event:** Handle the new event type in `streaming.ts` and store in Zustand state
- **Usage analytics endpoint:** `GET /api/conversations/{id}/usage` returning aggregated token counts
- **Web conversations route:** Add usage data to conversation list/detail responses
