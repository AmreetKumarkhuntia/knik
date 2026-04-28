# Plan 05: Conversation Compaction — Frontend

**Status:** Planning
**Last Updated:** April 2026

---

## Problem

The backend fully implements conversation summarization (`ConversationSummarizer` in `src/lib/services/conversation/summarizer.py`). When a conversation's token count crosses a threshold (default 75% of the model's context window), the backend automatically summarizes earlier messages and stores the summary in the `conversations` table (`summary`, `summary_through_index`, `total_tokens` columns).

The frontend has **no awareness of this**:

- There is no compaction indicator in the chat UI
- The user cannot see that older messages have been summarized away
- No summary text is ever displayed
- The SSE streaming service has no event type for summarization notifications
- `chatSlice.ts` has no state for summary metadata

---

## Proposed Approach

1. Surface summarization state in the conversation data returned by the backend
2. Emit a summarization event over SSE when compaction occurs during a stream
3. Show a visible divider/indicator in the chat UI at the compaction point
4. Optionally allow the user to view the summary text

---

## Key Files

| File                                                                | Change                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/apps/web/backend/routes/conversations.py`                      | Include `summary`, `summary_through_index`, `total_tokens` in conversation responses           |
| `src/apps/web/backend/routes/chat_stream.py`                        | Emit a `compaction` SSE event when summarization occurs during a stream                        |
| `src/apps/web/frontend/src/services/streaming.ts`                   | Handle new `compaction` event type                                                             |
| `src/apps/web/frontend/src/store/chatSlice.ts`                      | Add `summary`, `summaryThroughIndex`, `totalTokens` to conversation state                      |
| `src/apps/web/frontend/src/types/api.ts`                            | Add compaction fields to `Conversation` type                                                   |
| `src/apps/web/frontend/src/lib/sections/chat/ChatPanel.tsx`         | Render compaction divider between summarized and live messages                                 |
| `src/apps/web/frontend/src/lib/sections/chat/CompactionDivider.tsx` | **New** — component showing "Earlier messages summarized" with optional expand-to-view-summary |

---

## Rough Steps

1. **Update conversation API response** — ensure `GET /api/conversations/:id` returns `summary`, `summary_through_index`, `total_tokens` fields
2. **Update `Conversation` type** in `types/api.ts` to include these fields
3. **Update `chatSlice.ts`** — store summary metadata in conversation state; add action to set summary when compaction event arrives
4. **Add `compaction` SSE event** — in `chat_stream.py`, after `_post_chat()` triggers summarization, emit `{"event": "compaction", "data": {"summary": "...", "through_index": N}}` before the `done` event
5. **Handle `compaction` in `streaming.ts`** — parse the new event type and dispatch to the store
6. **Create `CompactionDivider.tsx`** — a horizontal rule with text like "Earlier messages were summarized to fit the context window" and an optional expandable block showing the summary text
7. **Render divider in `ChatPanel.tsx`** — when `summaryThroughIndex` is set, insert `<CompactionDivider>` between message at index `summaryThroughIndex` and the next message
8. **Test** — trigger summarization by having a very long conversation (or temporarily lower the threshold); verify the divider appears and the summary is accessible

---

## Notes

- The compaction divider should be visually distinct but not alarming — a subtle separator with muted text is appropriate
- `summary_through_index` is the key field: it tells the frontend exactly where in the message list the compaction boundary is
- When loading an existing conversation that already has a summary, the divider should appear immediately on load (no need to wait for a stream event)
- If the summarization threshold is configurable via settings (Plan 03), surface the current threshold and token count in the UI so users understand when compaction will trigger
- The SSE `compaction` event should be emitted even if the user is not actively watching the stream (the next page load will pick up the summary from the API anyway, but real-time feedback is better UX)
