# Conversation History

The AI assistant remembers previous conversations. Both Console and GUI apps maintain context throughout the conversation.

## How It Works

1. **User sends message** → Stored in `ConversationHistory.entries`
2. **AI responds** → Response paired with user message in history
3. **Next user message** → System retrieves last N conversation turns using `get_messages(last_n=5)`
4. **History conversion** → User messages → `HumanMessage`, AI responses → `AIMessage`
5. **Message structure sent to LLM**:
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

Set in `.env` file:

```bash
KNIK_HISTORY_CONTEXT_SIZE=5  # Number of conversation turns to include (default: 5)
KNIK_MAX_HISTORY_SIZE=50     # Maximum stored entries (default: 50)
```

## Benefits

- LLM remembers previous questions and answers
- Natural follow-up questions work ("What about that?", "Tell me more")
- Configurable context size balances memory vs performance
- Automatic size limits prevent unbounded growth

## Usage Example

**Console:**

```bash
You: What is 2+2?
AI: 2+2 equals 4.

You: Multiply that by 3
AI: If you multiply 4 by 3, you get 12.  # AI remembers "that" = 4
```

**GUI:** Same behavior - AI maintains context throughout the chat.

**Testing:**

```bash
npm run start:console
> My name is John
> What's my name?  # Should respond: John
```

Use `/debug` command to see history being passed.

## Technical Details

### Implementation

**ConversationHistory** (`src/apps/console/history.py`)
- `add_entry(user_input, ai_response)` - Store conversation turn
- `get_context(last_n=5)` - Get as formatted text string
- `get_messages(last_n=5)` - Get as LangChain message objects

**Message Flow**
```
Console/GUI App
    ↓ get_messages(last_n=5)
ConversationHistory
    ↓ [HumanMessage, AIMessage, ...]
AI Client → Provider
    ↓ [SystemMessage, ...history, current HumanMessage]
LLM (with full context)
```

### Streaming Compatibility

History works with both query modes:
- `chat_with_agent()` - Regular blocking queries
- `chat_with_agent_stream()` - Streaming responses

The agent automatically processes history and uses it for context-aware responses.
