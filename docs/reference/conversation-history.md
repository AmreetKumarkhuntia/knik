# Conversation History

The AI assistant remembers previous conversations through two complementary systems: an in-memory `ConversationHistory` for simple session tracking and a PostgreSQL-backed `ConversationDB` for persistent storage with compaction.

## In-Memory History (ConversationHistory)

Used by Console and GUI apps for session-level context.

## How It Works

1. **User sends message** -- stored in `ConversationHistory.entries`
2. **AI responds** -- response paired with user message in history
3. **Next user message** -- system retrieves last N conversation turns via `get_messages(last_n=5)`
4. **History conversion** -- user messages become `HumanMessage`, AI responses become `AIMessage`
5. **Message structure sent to LLM:**
   ```
   [SystemMessage] (if configured)
   [HumanMessage] Previous user input 1
   [AIMessage] Previous AI response 1
   [HumanMessage] Previous user input 2
   [AIMessage] Previous AI response 2
   ...
   [HumanMessage] Current user input
   ```

## Configuration

Set via environment variables (or `.env` file):

```bash
KNIK_HISTORY_CONTEXT_SIZE=5  # Number of conversation turns to include (default: 5)
KNIK_MAX_HISTORY_SIZE=50     # Maximum stored entries (default: 50)
```

## Benefits

- LLM remembers previous questions and answers
- Natural follow-up questions work ("What about that?", "Tell me more")
- Configurable context size balances memory vs token usage
- Automatic size limits prevent unbounded growth

## Usage Example

```bash
You: What is 2+2?
AI: 2+2 equals 4.

You: Multiply that by 3
AI: If you multiply 4 by 3, you get 12.  # AI remembers "that" = 4
```

Works identically across Console, GUI, and Web interfaces. Use `/debug` in Console to see history being passed.

## Technical Details

### Implementation

**ConversationHistory** (`src/apps/console/history.py`)

| Method            | Signature                            | Description                      |
| ----------------- | ------------------------------------ | -------------------------------- |
| `add_entry`       | `add_entry(user_input, ai_response)` | Store a conversation turn        |
| `get_context`     | `get_context(last_n=5) -> str`       | Get as formatted text string     |
| `get_messages`    | `get_messages(last_n=5) -> list`     | Get as LangChain message objects |
| `get_all_entries` | `get_all_entries() -> list[dict]`    | Get all stored entries           |
| `clear`           | `clear()`                            | Clear all history                |

### Message Flow

```
Console/GUI/Web App
    | get_messages(last_n=5)
    v
ConversationHistory
    | [HumanMessage, AIMessage, ...]
    v
AIClient.chat() / AIClient.chat_stream()
    | [SystemMessage, ...history, current HumanMessage]
    v
LLM Provider (with full context)
```

### Streaming Compatibility

History works with both methods:

- `chat()` -- regular blocking responses
- `chat_stream()` -- streaming responses (token by token)

### Web App Integration

The web backend (`src/apps/web/backend/routes/chat_stream.py`) maintains a global `ConversationHistory(max_size=50)` instance. The number of recent turns sent as context is controlled by `KNIK_HISTORY_CONTEXT_SIZE`.

The web API also exposes history endpoints:

- `GET /api/history` -- retrieve conversation history
- `POST /api/history/clear` -- clear history

---

## Persistent History (ConversationDB)

Used by Web, Bot, and any app mode with PostgreSQL configured. Conversations and messages are stored in the `conversations` table with full CRUD via `src/lib/services/conversation/db_client.py`.

### Key Features

- **PostgreSQL-backed** -- conversations survive app restarts
- **Token tracking** -- per-message usage stored in `metadata.usage` (input_tokens, output_tokens, total_tokens)
- **Automatic compaction** -- when token usage exceeds `KNIK_COMPACTION_THRESHOLD` (default 0.95), older messages are summarized and replaced with a cumulative summary
- **Cumulative summaries** -- stored in `summary` and `summary_through_index` columns; each new summary incorporates the previous one
- **Conversation API** -- full CRUD at `/api/conversations` with listing, creation, deletion, and message retrieval

### Compaction Flow

```
New message → LLM call → _post_chat()
    → increment_total_tokens()
    → should_compact(total_tokens, model)?
        → YES: ConversationSummarizer.run() as background task
            → Load all messages from DB
            → Fetch existing summary (cumulative)
            → Split: messages_to_compact | last N turns kept
            → Call LLM with compaction prompt
            → Store new summary + through_index
            → Reset total_tokens counter
        → NO: Done
```

### Web API Endpoints

| Method | Path                               | Description                                     |
| ------ | ---------------------------------- | ----------------------------------------------- |
| GET    | `/api/conversations/`              | List conversations (supports `limit`, `offset`) |
| POST   | `/api/conversations/`              | Create a new conversation                       |
| GET    | `/api/conversations/{id}`          | Get conversation with messages                  |
| DELETE | `/api/conversations/{id}`          | Delete a conversation                           |
| PATCH  | `/api/conversations/{id}`          | Update conversation title                       |
| GET    | `/api/conversations/{id}/messages` | Get messages (optional `last_n`)                |

### Compaction Configuration

| Variable                          | Default | Description                                      |
| --------------------------------- | ------- | ------------------------------------------------ |
| `KNIK_COMPACTION_ENABLED`         | `true`  | Enable automatic compaction                      |
| `KNIK_COMPACTION_THRESHOLD`       | `0.95`  | Fraction of context window to trigger compaction |
| `KNIK_COMPACTION_CIRCUIT_BREAKER` | `3`     | Max consecutive failures before disabling        |
| `KNIK_COMPACTION_PROMPT_BUFFER`   | `1024`  | Tokens reserved for compaction prompt            |
