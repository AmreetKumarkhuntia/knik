# Conversation History

The AI assistant remembers previous conversations. Console, GUI, and Web apps all maintain context throughout a conversation.

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

| Method | Signature | Description |
| --- | --- | --- |
| `add_entry` | `add_entry(user_input, ai_response)` | Store a conversation turn |
| `get_context` | `get_context(last_n=5) -> str` | Get as formatted text string |
| `get_messages` | `get_messages(last_n=5) -> list` | Get as LangChain message objects |
| `get_all_entries` | `get_all_entries() -> list[dict]` | Get all stored entries |
| `clear` | `clear()` | Clear all history |

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
