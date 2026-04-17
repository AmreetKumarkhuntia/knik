# Dynamic Model Discovery, Token Tracking & Context Summarization

**Status:** Implemented (Core Complete, Deferred Items Pending)
**Last Updated:** April 2026

This document describes the design and implementation of three interconnected features: dynamic model discovery from provider APIs, per-call token usage tracking, and automatic context summarization when conversations approach model context limits.

---

## Current State

### Model Discovery -- Dynamic with Static Fallback

Models are discovered dynamically from provider APIs via `get_models()` methods on each provider. The static `Config.AI_MODELS` dict (in `src/lib/core/config.py`, lines 86-99) maps 12 model IDs to descriptions and serves as the fallback when API calls fail.

Each provider implements `get_models()` which queries its respective API. The base class provides `get_models_with_fallback()` (`base_provider.py:89-124`) that tries the API first, then falls back to filtering `Config.AI_MODELS` by provider prefix via `_PROVIDER_MODEL_PREFIXES`.

`AIClient` exposes:
- `list_models_for_provider(provider_name)` (`client.py:565-589`) -- lists models for a specific provider
- `list_all_models()` (`client.py:591-602`) -- aggregates across all registered providers via `ProviderRegistry`

The admin API endpoint `GET /models` still returns the static dict (deferred item).

### Token Tracking -- Implemented

Token usage is captured from LangChain's response metadata on every LLM call:

- **Non-streaming:** `AIMessage.usage_metadata` is extracted via `_extract_usage()` (`base_provider.py:196-219`) and stored in `ChatResult.usage`
- **Streaming:** The final chunk's `usage_metadata` is captured after stream iteration (`base_provider.py:296-297`)

`ChatResult` dataclass (`base_provider.py:17-23`) returns `{content, usage}` from all `chat()` code paths. Usage is stored in `ConversationMessage.metadata` as `{input_tokens, output_tokens, total_tokens}` inside the JSONB messages array.

Integration points:
- `chat_stream.py:145-151` -- emits `usage` SSE event
- `chat.py:62-63` -- includes usage in HTTP response
- `console/app.py:189-194` -- displays `[tokens: X in / Y out / Z total]`
- `db_client.py:229-261` -- `get_conversation_token_usage()` sums usage across messages

### Context Management -- Summarization with Sliding Window

The conversation history uses a configurable sliding window (`history_context_size`, default 5, via `KNIK_HISTORY_CONTEXT_SIZE` env var).

`ConversationSummarizer` (`src/lib/services/conversation/summarizer.py`) automatically compresses older messages when token count reaches 75% of the model's context window. It uses cumulative summaries and keeps the last 2 turn pairs unsummarized.

The `conversations` table (after migration 008) includes `summary`, `summary_through_index`, and `total_tokens` columns.

---

## Known Gaps & Bugs

### HIGH Priority

| # | Gap | Location | Description |
|---|-----|----------|-------------|
| 1 | `MODEL_DISCOVERY_TIMEOUT` unused | All 6 providers' `requests.get()` | Config value defined at `config.py:80,177-181` but every provider hardcodes `timeout=5` instead of reading from config |
| 2 | `through_index` discarded | `client.py:305,387` | `summary_through_index` from `get_summary()` is thrown away (`_`). Messages between the summary's coverage end and the loaded recent window can be entirely lost from LLM context |
| 3 | Streaming usage missing for OpenAI-compatible providers | `base_provider.py:292` | `self.llm.stream()` is called without `stream_usage=True`. ZAI, ZAICoding, ZhipuAI, and Custom providers will always report `None` usage on streaming calls |

### MEDIUM Priority

| # | Gap | Location | Description |
|---|-----|----------|-------------|
| 4 | `_keep_recent` ignores env var | `summarizer.py:89` | Reads `Config.DEFAULT_SUMMARIZATION_KEEP_RECENT` (ClassVar) instead of `Config().summarization_keep_recent` (env-aware). `KNIK_SUMMARIZATION_KEEP_RECENT` has no effect |
| 5 | Agent usage not cumulative | `base_provider.py:259,316` | Multi-step agent calls only capture usage from the last AIMessage, not the sum across all intermediate LLM calls |
| 6 | `ModelInfo` dataclass unused | `base_provider.py:26-40` | Defined but never used by any `get_models()` implementation -- dead code |

### LOW Priority

| # | Gap | Location | Description |
|---|-----|----------|-------------|
| 7 | No dedup between summary and history | `client.py:301-306` | If recent window overlaps with summary coverage, messages appear in both compressed and full form, wasting tokens |
| 8 | `_PROVIDER_MODEL_PREFIXES` missing "custom" | `base_provider.py:81-87` | Fallback for custom provider returns ALL models from `Config.AI_MODELS` instead of being filtered |

---

## Part 1: Dynamic Model Discovery (Implemented)

### Architecture

#### Abstract Method on BaseAIProvider

`src/lib/services/ai_client/providers/base_provider.py`:

- `get_models() -> list[dict[str, Any]]` -- abstract method (`line 70`), each provider implements
- `get_models_with_fallback() -> list[dict[str, Any]]` -- concrete method (`lines 89-124`), tries `get_models()`, catches exceptions, falls back to filtering `Config.AI_MODELS` by provider prefix
- `ModelInfo` dataclass (`lines 26-40`) -- defined but currently unused by implementations

Each model dict follows this schema:

```python
{
    "id": "gemini-2.0-flash",
    "name": "Gemini 2.0 Flash",
    "context_window": 1048576,
    "provider": "vertex"
}
```

### Per-Provider Implementation

| Provider | File | API Source | Auth | Line |
|----------|------|-----------|------|------|
| Vertex | `vertex_provider.py` | Google Cloud REST `GET /v1/publishers/google/models` | Service account (ADC) | 100-135 |
| Gemini | `gemini_provider.py` | REST `GET /v1beta/models` | API key from env | 124-156 |
| ZAI | `zai_provider.py` | OpenAI-compatible `GET {base_url}/models` | Bearer token from env | 124-149 |
| ZAI Coding | `zai_coding_provider.py` | OpenAI-compatible `GET {base_url}/models` | Bearer token from env | 134-159 |
| Custom | `custom_provider.py` | OpenAI-compatible `GET {base_url}/models` | Bearer token (optional) | 134-161 |
| ZhipuAI | `zhipuai_provider.py` | REST `GET /api/paas/v4/models` | API key from env | 127-152 |
| Mock | `mock_provider.py` | Returns static hardcoded list | None | 54-62 |

All implementations:
- Use `requests` with a hardcoded `timeout=5` (should use `Config().model_discovery_timeout`)
- Wrap the API call in try/except, returning `[]` on failure
- Call `get_context_window()` as fallback for context window size when the API doesn't provide it

### AIClient Integration

`src/lib/services/ai_client/client.py`:

- `list_models_for_provider(provider_name) -> list[dict]` (`line 565`) -- instantiates the provider, calls `get_models_with_fallback()`
- `list_all_models() -> dict[str, list[dict]]` (`line 591`) -- iterates all registered providers via `ProviderRegistry.list_providers()`, aggregates results

### Config

`src/lib/core/config.py`:

- `Config.AI_MODELS` (`lines 86-99`) -- static fallback, 12 entries
- `Config.AI_MODELS_CONTEXT_WINDOWS` (`lines 104-132`) -- static context window mapping, 21 entries
- `Config.DEFAULT_MODEL_DISCOVERY_TIMEOUT = 5` (`line 80`)
- `Config.model_discovery_timeout` (`lines 177-181`) -- reads `KNIK_MODEL_DISCOVERY_TIMEOUT` env var

### Provider Registry

`src/lib/services/ai_client/registry/provider_registry.py`:

All 7 providers self-register at module load time via `ProviderRegistry.register()`.

---

## Part 2: Token Tracking (Implemented)

### ChatResult Dataclass

`src/lib/services/ai_client/providers/base_provider.py` (`lines 17-23`):

```python
@dataclass
class ChatResult:
    content: str
    usage: dict[str, int] | None = None  # {input_tokens, output_tokens, total_tokens}
```

All `chat()` code paths return `ChatResult` (regular, agent-based, and mock).

### Usage Extraction

`_extract_usage()` (`base_provider.py:196-219`):

- Path 1: `result.usage_metadata` -> `{input_tokens, output_tokens, total_tokens}`
- Path 2: `result.response_metadata.token_usage` or `.usage` -> maps `prompt_tokens`/`completion_tokens` to standardized keys
- Returns `None` if neither is available

### Streaming

`chat_stream()` (`base_provider.py:286-331`):

- Regular streaming: captures `last_chunk`, extracts usage after iteration (`line 297`)
- Agent streaming: tracks `last_ai_message`, extracts usage after iteration (`line 331`)
- `last_usage` reset to `None` at start of each stream (`line 288`)

### Storage

Usage is merged into `ConversationMessage.metadata` via `_post_chat()` in `client.py:513-514`:

```python
if usage:
    msg_metadata["usage"] = usage
```

Stored as part of the JSONB messages array in the `conversations` table.

### DB Methods

`src/lib/services/conversation/db_client.py`:

- `get_conversation_token_usage(conversation_id)` (`line 229`) -- sums all `metadata.usage` across messages
- `increment_total_tokens(conversation_id, tokens)` (`line 275`) -- atomic cumulative counter
- `get_total_tokens(conversation_id)` (`line 263`) -- reads cumulative counter
- `reset_total_tokens(conversation_id, tokens)` (`line 295`) -- resets counter after summarization

### Integration Points

| Integration | File | Behavior |
|---|---|---|
| Web streaming SSE | `chat_stream.py:145-151` | Emits `event: usage` SSE event |
| Web non-streaming | `chat.py:62-63` | Includes `usage` in JSON response |
| Console | `app.py:189-194` | Displays `[tokens: X in / Y out / Z total]` |
| DB persistence | `client.py:513-516` | Stores usage in message metadata |
| Cumulative tracking | `client.py:524` | Increments `total_tokens` column after each call |

### Dependencies

- `tiktoken>=0.7.0` in `requirements.txt` (line 39) -- used for pre-call token estimation in summarization

---

## Part 3: Context Summarization (Implemented)

### ConversationSummarizer Class

`src/lib/services/conversation/summarizer.py` (209 lines)

#### Flow

```
New user message arrives -> LLM call completes -> _post_chat()
        |
        v
increment_total_tokens() -> get new cumulative count
        |
        v
should_summarize(total_tokens, model)
  - Checks SUMMARIZATION_ENABLED
  - total_tokens >= (context_window * threshold)?
        |
        +-- No --> Done
        |
        +-- Yes --> Schedule summarizer.run() as background task
                        |
                        v
                  Load all messages from DB
                  Fetch existing summary (cumulative)
                  Split: messages_to_summarize | last N turn pairs kept
                  Call LLM with summarization prompt
                  Store new summary + through_index in DB
                  Reset total_tokens counter
```

### Token Counting

`src/lib/services/ai_client/token_utils.py` (176 lines):

- `count_tokens(text, model)` (`line 53`) -- uses tiktoken with `cl100k_base` fallback for unsupported models
- `count_message_tokens(messages, model)` (`line 73`) -- accounts for message formatting overhead (+4 per message, +3 reply priming)
- `register_context_window(model_id, context_window)` (`line 145`) -- runtime cache for discovered context windows
- `get_context_window(model)` (`line 156`) -- three-tier resolution: runtime cache -> `Config.AI_MODELS_CONTEXT_WINDOWS` -> default 8192

### Summarization Strategy

- **Same provider's LLM** -- uses current provider/model with `max_tokens=1024`, `temperature=0.3`
- **Cumulative summaries** -- each new summary incorporates the previous one via the prompt
- **Keep recent turns** -- last 2 turn pairs (configurable) kept verbatim
- **Guard against concurrent runs** -- `_in_progress` set prevents duplicate summarization

### Summarization Prompt

```
You are summarizing a conversation between a user and an AI assistant.
Produce a concise summary that preserves:
- Key facts and information discussed
- Decisions made and preferences expressed
- Technical details, code snippets, and specific values mentioned
- The current topic and direction of conversation
- Any outstanding questions or tasks

{previous_summary_section}

Conversation to summarize:
{messages}

Summary:
```

### Database Schema

Migration `db/migrations/008_add_conversation_summary.sql`:

```sql
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_through_index INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
```

### DB Client Methods

`src/lib/services/conversation/db_client.py`:

- `get_summary(conversation_id)` (`line 314`) -- returns `(summary, through_index)`
- `update_summary(conversation_id, summary, through_index)` (`line 331`) -- updates summary columns

### AIClient Integration

In `src/lib/services/ai_client/client.py`:

1. Before every call: `_load_history()` loads last N messages, `inject_summary()` prepends summary as `SystemMessage` (`lines 301-306`, `383-388`)
2. After every call: `_post_chat()` increments tokens, checks threshold, triggers summarizer as background task (`lines 523-532`)

### Config

`src/lib/core/config.py`:

| Setting | ClassVar Default | Env Var | Lines |
|---|---|---|---|
| `summarization_enabled` | `True` | `KNIK_SUMMARIZATION_ENABLED` | 84, 186-190 |
| `summarization_threshold` | `0.75` | `KNIK_SUMMARIZATION_THRESHOLD` | 82, 191-195 |
| `summarization_keep_recent` | `2` | `KNIK_SUMMARIZATION_KEEP_RECENT` | 83, 196-200 |

---

## File Change Manifest (Implemented)

### Files Modified

| File | Changes | Part |
|------|---------|------|
| `src/lib/services/ai_client/providers/base_provider.py` | `ChatResult`, `ModelInfo`, `get_models()` abstract, `get_models_with_fallback()`, `get_context_window()`, `_extract_usage()`, `last_usage`, capture in `chat()`/`chat_stream()` | 1, 2, 3 |
| `src/lib/services/ai_client/providers/vertex_provider.py` | `get_models()` with Vertex AI REST API | 1 |
| `src/lib/services/ai_client/providers/gemini_provider.py` | `get_models()` with Gemini API | 1 |
| `src/lib/services/ai_client/providers/zai_provider.py` | `get_models()` with OpenAI-compatible API | 1 |
| `src/lib/services/ai_client/providers/zai_coding_provider.py` | `get_models()` with OpenAI-compatible API | 1 |
| `src/lib/services/ai_client/providers/custom_provider.py` | `get_models()` with OpenAI-compatible API | 1 |
| `src/lib/services/ai_client/providers/zhipuai_provider.py` | `get_models()` with ZhipuAI API | 1 |
| `src/lib/services/ai_client/providers/mock_provider.py` | `get_models()` with static data | 1 |
| `src/lib/services/ai_client/client.py` | `list_models_for_provider()`, `list_all_models()`, `get_last_usage()`, summarizer integration, `_post_chat()` with token tracking | 1, 2, 3 |
| `src/lib/services/conversation/db_client.py` | `get_conversation_token_usage()`, `increment_total_tokens()`, `get_total_tokens()`, `reset_total_tokens()`, `get_summary()`, `update_summary()` | 2, 3 |
| `src/lib/core/config.py` | `MODEL_DISCOVERY_TIMEOUT`, `SUMMARIZATION_THRESHOLD`, `KEEP_RECENT`, `ENABLED`, `AI_MODELS_CONTEXT_WINDOWS` | 1, 3 |
| `src/apps/web/backend/routes/chat_stream.py` | Capture and emit token usage via SSE | 2 |
| `src/apps/web/backend/routes/chat.py` | Return token usage in response | 2 |
| `src/apps/console/app.py` | Display token usage after responses | 2 |
| `requirements.txt` | Added `tiktoken>=0.7.0` | 2, 3 |

### Files Created

| File | Purpose | Part |
|------|---------|------|
| `src/lib/services/ai_client/token_utils.py` | `count_tokens()`, `count_message_tokens()`, `register_context_window()`, `get_context_window()` | 3 |
| `src/lib/services/conversation/summarizer.py` | `ConversationSummarizer` -- context preparation and summarization | 3 |
| `db/migrations/008_add_conversation_summary.sql` | Add `summary`, `summary_through_index`, `total_tokens` columns | 3 |
| `src/lib/services/ai_client/registry/provider_registry.py` | `ProviderRegistry` -- provider class registration | 1 |
| `src/lib/commands/service.py` | `list_models()`, `switch_model()` for console commands | 1 |

---

## Deferred Work (Not Yet Implemented)

### API & Backend

| # | Item | Details |
|---|------|---------|
| 1 | Admin API `GET /models` dynamic | `admin.py:87-89` still returns static `Config.AI_MODELS`. Should call `AIClient.list_all_models()` |
| 2 | Usage analytics endpoint | No `GET /api/conversations/{id}/usage`. `db_client.get_conversation_token_usage()` exists but has no route |
| 3 | Conversation responses with usage | `Conversation.to_dict()` and `ConversationMessage.to_dict()` include no usage fields |

### Frontend

| # | Item | Details |
|---|------|---------|
| 4 | Frontend model selector | No component fetches models from API or renders a picker dropdown |
| 5 | Frontend token display | `ChatPanel` renders messages without token info. `Message` type has no usage fields |
| 6 | Frontend SSE `usage` event | Backend emits `usage` SSE event but `streaming.ts` has no `onUsage` callback |
| 7 | Zustand store for usage | `chatSlice.ts` does not track token usage data |

### GUI

| # | Item | Details |
|---|------|---------|
| 8 | GUI settings panel model picker | `settings_panel.py:54-58` uses hardcoded 3-model list. Should populate dynamically |

---

## Bug Fix Plan

### Fix 1: Use configurable discovery timeout (HIGH)

Replace `timeout=5` with `timeout=Config().model_discovery_timeout` in all 6 providers:
- `vertex_provider.py:113`
- `gemini_provider.py:130`
- `zai_provider.py:131`
- `zai_coding_provider.py:141`
- `custom_provider.py:143`
- `zhipuai_provider.py:134`

### Fix 2: Respect through_index in history loading (HIGH)

In `client.py` (`_load_history` and `achat`/`achat_stream`):
- Don't discard `through_index` from `get_summary()`
- Ensure loaded history window starts from `max(0, through_index + 1)` or overlaps with summary coverage
- Add `start_index` parameter to `get_recent_messages()` in `db_client.py`

### Fix 3: Enable streaming usage for OpenAI-compatible providers (HIGH)

In `base_provider.py:292`, pass `stream_usage=True` to `self.llm.stream()` (or set it on the LLM constructor for OpenAI-compatible providers).

### Fix 4: Wire keep_recent env var (MEDIUM)

In `summarizer.py:89`, change from `Config.DEFAULT_SUMMARIZATION_KEEP_RECENT` to `Config().summarization_keep_recent`.

### Fix 5: Cumulative agent usage (MEDIUM)

In `base_provider.py`, accumulate usage across all AIMessages in agent flow instead of only capturing the last one.

### Fix 6: Remove dead ModelInfo dataclass (MEDIUM)

Either use `ModelInfo` in `get_models()` implementations or remove it.

### Fix 7: Dedup summary/history overlap (LOW)

In `client.py`, filter out messages from the loaded window that are already covered by the summary (based on `through_index`).

### Fix 8: Add "custom" to provider prefixes (LOW)

Add `"custom": []` or appropriate prefixes to `_PROVIDER_MODEL_PREFIXES` in `base_provider.py:81-87`.
