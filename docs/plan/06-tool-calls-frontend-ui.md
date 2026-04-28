# Plan 06: Tool Calls — Frontend UI

**Status:** Planning
**Last Updated:** April 2026

---

## Problem

The frontend chat UI only renders `user` and `assistant` messages. Tool calls and tool results are completely invisible to the user. The backend executes tools (browser, etc.) during a conversation but never surfaces these events to the frontend:

- `ChatPanel.tsx` only handles `user` and `assistant` roles — `tool` role messages are ignored
- `chatSlice.ts` `Message` type only has `role: 'user' | 'assistant'`
- The SSE streaming service only handles `text`, `audio`, `conversation_id`, `done`, and `error` events — no `tool_call` or `tool_result` events
- `chat_stream.py` streams text chunks but does not emit separate tool call/result events
- The `ConversationMessage` type in `types/api.ts` already includes `role: 'tool'` in the union — so the data model is partially ready

---

## Proposed Approach

1. Emit `tool_call` and `tool_result` SSE events from the backend when tools are invoked during a stream
2. Extend the frontend streaming handler and state to track tool calls
3. Render tool call/result blocks in the chat UI inline with messages

---

## Key Files

| File                                                            | Change                                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/lib/services/ai_client/registry/mcp_registry.py`           | In `_wrap_with_logging()`, after executing a tool, emit tool call/result to a callback or queue |
| `src/apps/web/backend/routes/chat_stream.py`                    | Pass a tool event callback into `achat_stream`; emit `tool_call` and `tool_result` SSE events   |
| `src/apps/web/frontend/src/services/streaming.ts`               | Handle `tool_call` and `tool_result` event types                                                |
| `src/apps/web/frontend/src/store/chatSlice.ts`                  | Add `role: 'tool_call' \| 'tool_result'` to `Message` type; add actions for tool events         |
| `src/apps/web/frontend/src/types/api.ts`                        | Extend `ConversationMessage` tool role with `tool_name`, `tool_input`, `tool_output` fields     |
| `src/apps/web/frontend/src/lib/sections/chat/ChatPanel.tsx`     | Render `ToolCallBlock` for tool messages                                                        |
| `src/apps/web/frontend/src/lib/sections/chat/ToolCallBlock.tsx` | **New** — collapsible block showing tool name, input, output                                    |

---

## Rough Steps

1. **Design the SSE event shape**:
   ```json
   // tool_call event (before execution)
   {"event": "tool_call", "data": {"id": "tc_123", "name": "browser_navigate", "input": {"url": "..."}}}
   // tool_result event (after execution)
   {"event": "tool_result", "data": {"id": "tc_123", "name": "browser_navigate", "output": "...", "error": null}}
   ```
2. **Add tool event emission in `mcp_registry.py`** — the `_wrap_with_logging()` wrapper already fires before/after each tool call; add an optional `on_tool_event` callback parameter that routes can provide
3. **Wire the callback in `chat_stream.py`** — create a queue or async generator that receives tool events; yield them as SSE events in the stream response between text chunks
4. **Extend `streaming.ts`** — add cases for `tool_call` and `tool_result` event types; dispatch to store
5. **Extend `chatSlice.ts`** — add `ToolCallMessage` type with `id`, `name`, `input`, `output`, `status: 'pending' | 'done' | 'error'`; add reducers for `toolCallStarted` and `toolCallCompleted`
6. **Create `ToolCallBlock.tsx`** — collapsible component; shows tool name + spinner while pending, expands to show input/output when done; use a code-like style for JSON input/output
7. **Update `ChatPanel.tsx`** — map over messages including tool call messages; render `<ToolCallBlock>` for tool events inline at the point they occurred in the conversation
8. **Handle historical tool calls** — when loading an existing conversation, tool role messages from the DB should also be rendered (the `ConversationMessage.role: 'tool'` type already exists)
9. **Test** — trigger a tool call (e.g., browser navigation); verify the tool call block appears in the UI with status transitions

---

## Notes

- Tool call blocks should be collapsed by default to avoid cluttering the UI — a subtle "Used: browser_navigate" label that expands on click is the right UX
- For long tool outputs (e.g., full page HTML), truncate with a "show more" option
- The `id` field on tool events is important for matching `tool_call` and `tool_result` events — make sure the backend and frontend use the same ID
- This feature is closely related to Plan 05 (compaction) — both require SSE event extensions and `ChatPanel` updates; consider implementing them together
- Streaming tool events must not block the text stream — they should be interleaved naturally as they occur
