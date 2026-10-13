# Streaming

How a reply streams from the model to the web backend's SSE endpoint, the Telegram bot and the console.

## Stream events

A streamed chat yields typed events, one small frozen dataclass per kind, defined in
`src/lib/services/ai_client/stream_events.py`. Consumers `match` on the type.

| Event               | Fields                                                                           | Meaning                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ConversationReady` | `conversation_id`                                                                | The conversation the reply belongs to (created if needed). First; never sent without a database            |
| `TextDelta`         | `text`                                                                           | The next piece of the reply                                                                                |
| `ToolCallStarted`   | `tool_name`, `tool_call_id`, `tool_args`                                         | The model called a tool                                                                                    |
| `ToolCallFinished`  | `tool_name`, `tool_call_id` (or `None`), `result_preview` (first 200 characters) | The tool returned                                                                                          |
| `StreamError`       | `message` (`"Chat streaming error: ..."`)                                        | The provider failed mid-stream. Its message is reply text: apps show it and it is saved like a `TextDelta` |
| `StreamDone`        | `conversation_id`, `usage` (or `None`), `full_response`                          | Last, after the reply is saved                                                                             |

`ProviderEvent` is `TextDelta | ToolCallStarted | ToolCallFinished`; `StreamEvent` adds the other three.

`AIClient` streams at three levels:

- `stream_events(prompt, history=...)`: provider only. Yields the provider's events; a provider failure is
  logged and ends the stream with a `StreamError`. Token usage is in `client.last_usage` afterwards.
- `chat_stream(prompt, history=...)`: the text of `stream_events()` as plain strings (`TextDelta` and
  `StreamError` text), without the tool calls. The console uses it.
- `achat_stream(prompt, conversation_id=...)`: async, with the conversation around the reply. It yields
  `ConversationReady` (when the database is reachable), saves the user message and loads the history, yields the
  provider's events while the provider runs on a worker thread, saves the reply and yields `StreamDone`. An
  error outside the provider stream (a non-database failure while saving, say) is raised, not yielded. The web
  backend and the bot use it.

```python
async for event in client.achat_stream(prompt, conversation_id=conversation_id):
    match event:
        case TextDelta(text=text) | StreamError(message=text):
            show(text)
        case ToolCallStarted(tool_name=name):
            show_tool(name)
        case StreamDone(usage=usage):
            record(usage)
```

## Web backend: Server-Sent Events

**Endpoint:** `POST /api/chat/stream/` (`src/backend/routes/chat_stream.py`), body
`{"message": "...", "conversation_id": "optional"}`, response `text/event-stream` with `Cache-Control: no-cache`,
`Connection: keep-alive` and `X-Accel-Buffering: no`. Each event is `event: <name>` and `data: <JSON>`.

| SSE event         | `data`                                                                  | Sent                                                                      |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `conversation_id` | `{"conversation_id": "<uuid>"}`                                         | First, for `ConversationReady`                                            |
| `text`            | `{"text": "<chunk>"}`                                                   | For each `TextDelta`, and for a `StreamError` (its message as text)       |
| `tool_start`      | `{"tool_name": "...", "tool_args": {...}}`                              | For each `ToolCallStarted`                                                |
| `tool_end`        | `{"tool_name": "...", "tool_result_preview": "..."}`                    | For each `ToolCallFinished`                                               |
| `audio`           | `{"audio": "<base64 WAV>", "sample_rate": 24000}`                       | Whenever a sentence's speech is ready, between text events and at the end |
| `usage`           | `{"usage": {"input_tokens": N, "output_tokens": N, "total_tokens": N}}` | After the reply, when the provider reported usage                         |
| `compaction`      | `{"summary_message_id": "<id>"}`                                        | After the reply, when this turn compacted the conversation                |
| `done`            | `{"audio_count": N}`                                                    | Last, once all audio is sent                                              |
| `error`           | `{"error": "<message>"}`                                                | Instead of the rest, when an exception escapes the stream                 |

A tool that needs consent is refused in web chats unless `KNIK_WEB_TOOL_CONSENT=allow`; the model then gets
`Permission denied for <tool>` as the tool's result (see [Tools](../guides/mcp.md#consent)).

### Speech

The text never waits for speech. As text arrives the route cuts a sentence off after a sentence ending (`.`,
`!`, `?` or a newline) and queues each sentence that has something to say (`is_speakable()`) for a background
TTS task. The queue holds at most 10 sentences, which slows the stream down only if the model is far ahead of the
speech. The task generates
WAV audio with the backend's Kokoro voice; a sentence that fails is logged and skipped. Ready audio is sent
between text events. After the reply, the remaining text is queued, the route waits up to 30 seconds for the TTS
task and sends the rest of the audio before `usage`, `compaction` and `done`.

### Example

```bash
curl -N -X POST http://localhost:8010/api/chat/stream/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a short joke"}'
```

With the mock provider (`KNIK_AI_PROVIDER=mock`):

```
event: conversation_id
data: {"conversation_id": "1e66fb1f-2ca0-4949-b331-c408dbaf23ce"}

event: text
data: {"text": "Mock "}

event: text
data: {"text": "AI "}

...

event: text
data: {"text": "responses. "}

event: audio
data: {"audio": "UklGRiQAAABXQVZF...", "sample_rate": 24000}

event: audio
data: {"audio": "UklGRiQAAABXQVZF...", "sample_rate": 24000}

event: usage
data: {"usage": {"input_tokens": 10, "output_tokens": 9, "total_tokens": 19}}

event: done
data: {"audio_count": 2}
```

### Without streaming

`POST /api/chat/` (`routes/chat.py`) takes the same body and answers once, with the whole reply spoken as one
WAV:

```json
{
  "text": "...",
  "audio": "<base64 WAV>",
  "sample_rate": 24000,
  "conversation_id": "<uuid>",
  "usage": { "input_tokens": 10, "output_tokens": 15, "total_tokens": 25 }
}
```

`usage` is left out when the provider reports none.

### Frontend

The React frontend (`src/frontend`) currently runs on an in-memory demo session and does not call these
endpoints.

## Telegram bot

`StreamingResponseManager.deliver()` (`src/bot/streaming.py`) consumes `achat_stream()` and writes the reply to
the chat through the `MessagingTransport` (`TelegramClient` in production):

- Text goes to the chat one segment at a time: the text between two tool calls is one segment, streamed with
  `transport.send_stream()`. A segment starts at its first visible text, so whitespace alone (which models often
  send before a tool call) sends nothing.
- A tool call closes the current segment and sends a notice, `🔧 Calling <tool>(<args>)...`, then
  `✓ <tool> completed` (or `✓ <tool> completed (no output)`) when it returns.
- `TelegramClient.send_stream()` shows the segment as a live draft (`sendMessageDraft`, private chats only,
  updated at most every 0.5 seconds) while it streams, then sends it as permanent messages, split at Telegram's
  4096-character limit.

It returns a `DeliveryResult`:

| Field                      | Meaning                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `response_text`            | The full reply                                                                                        |
| `conversation_id`, `usage` | From the stream                                                                                       |
| `message_ids`              | The messages sent                                                                                     |
| `error`                    | Set when the reply could not be produced; nothing after the failure was sent                          |
| `send_errors`              | Reply segments the transport reported as failed: the reply was produced but not all its text was seen |
| `delivered`                | `True` when there is neither an `error` nor a `send_error`                                            |

A tool notice that fails to send is only logged: its tools have already run, and the bot's error reply would have
the user run them again.

## Console

The console calls `chat_stream()` with its in-memory history and prints the text as it arrives. With voice output
on (`KNIK_VOICE_OUTPUT`), it hands the text to `TTSAsyncProcessor`, which converts text to audio on one thread and
plays it on another; call `start_async_processing()` before `play_async()`, and wait for
`is_processing_complete()` before exiting.

## Related documentation

- [Tools](../guides/mcp.md) - tool calls and consent
- [Environment Variables](../reference/environment-variables.md)
- [API Reference](../reference/api.md)
