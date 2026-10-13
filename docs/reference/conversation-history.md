# Conversation History

The assistant remembers earlier turns in two ways: the console keeps its history in memory, and the web
backend and the Telegram bot store conversations in Postgres, where long ones are compacted into a summary.
Each stored conversation records its owner (a `users` row) and its source; a bot user lists and resumes only their
own conversations, and the web and console see the web's and older ones.

## In-memory history (console)

`ConversationHistory` (`src/console/history.py`) keeps up to 50 turns (user input plus reply) for the running
console. Before each message the console takes the last `KNIK_HISTORY_CONTEXT_SIZE` turns (5 by default) as
LangChain messages and passes them to `AIClient.chat_stream()`:

```
[SystemMessage] (if configured)
[HumanMessage] Previous user input 1
[AIMessage] Previous AI response 1
...
[HumanMessage] Current user input
```

| Method            | Signature                            | Description                      |
| ----------------- | ------------------------------------ | -------------------------------- |
| `add_entry`       | `add_entry(user_input, ai_response)` | Store a conversation turn        |
| `get_context`     | `get_context(last_n=5) -> str`       | Get as formatted text string     |
| `get_messages`    | `get_messages(last_n=5) -> list`     | Get as LangChain message objects |
| `get_all_entries` | `get_all_entries() -> list[dict]`    | Get all stored entries           |
| `clear`           | `clear()`                            | Clear all history                |

`/history` shows it, `/clear` empties it, and `/debug on` prints how many history messages each request sends.

```text
You: What is 2+2?
AI: 2+2 equals 4.

You: Multiply that by 3
AI: If you multiply 4 by 3, you get 12.
```

## Stored conversations (web backend and bot)

`AIClient.achat()` and `achat_stream()` manage a conversation stored through `ConversationDB`
(`src/lib/services/db/repositories/conversations.py`). For each message they:

1. Create the conversation, or reuse the given one.
2. Save the user message.
3. Load the history: the last `KNIK_HISTORY_CONTEXT_SIZE` turn pairs, or, once the conversation has been
   compacted, every message from the summary on. A stored reply that called tools is replayed as the tool calls,
   their results and the final text.
4. Call the model.
5. Save the reply with its token usage and tool calls in the message metadata, and add the turn's
   `total_tokens` to the conversation's running total.
6. Compact the conversation if this turn crossed the threshold (below).
7. After the conversation's first reply, generate a title in the background.

When Postgres is unreachable each step is skipped with a warning and the chat still answers, without history.

If the model call fails, `achat()` raises with the user message saved and no reply; a conversation it created for that
turn is deleted again, since the caller never got its id. `achat_stream()` saves the error text as the reply instead.
Both take `persist=False` to answer without loading, creating or saving a conversation.

### Compaction

After a reply, if the turn's input tokens reach `KNIK_COMPACTION_THRESHOLD` (0.95) of the model's context
window, the reply waits while the conversation is compacted (`src/lib/services/ai_client/compaction.py`):

- The whole conversation is summarised by the model into a structured summary (goal, constraints, progress,
  decisions, tool activity, next steps). If the messages do not fit, the oldest are left out, keeping
  `KNIK_COMPACTION_PROMPT_BUFFER` tokens free for the summary.
- The summary is appended as a message, and the conversation's `summary_message_id` points at it. Later
  requests load history from that message on, sending the summary as a user message. Older messages stay in
  the database.
- A failed compaction increments the conversation's `compacted_count`; at `KNIK_COMPACTION_CIRCUIT_BREAKER`
  (3) consecutive failures it is no longer tried.
- The web backend's stream sends a `compaction` event when a turn compacted the conversation (see
  [Streaming](../development/streaming.md)).

`KNIK_COMPACTION_ENABLED=false` turns it off. See
[Environment Variables](environment-variables.md#context-compaction).

The web API for stored conversations is listed in the [API Reference](api.md#conversations-apiconversations).
