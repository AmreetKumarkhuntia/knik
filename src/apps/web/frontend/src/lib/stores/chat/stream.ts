import type { ChatStreamEvent, ConversationMessage, ToolCall } from '$types/conversation'

export const toolCallsOf = (message: ConversationMessage): ToolCall[] =>
  Array.isArray(message.metadata.tool_calls) ? (message.metadata.tool_calls as ToolCall[]) : []

/** Folds one stream event into the assistant message it belongs to. */
export function applyStreamEvent(
  message: ConversationMessage,
  event: ChatStreamEvent
): ConversationMessage {
  const calls = toolCallsOf(message)
  switch (event.type) {
    case 'message_start':
      return { ...message, metadata: { ...message.metadata, ...event.metadata, streaming: true } }
    case 'tool_start':
      return {
        ...message,
        metadata: {
          ...message.metadata,
          tool_calls: [
            ...calls.filter(call => call.id !== event.call.id),
            { ...event.call, status: 'running' },
          ],
        },
      }
    case 'tool_end':
      return {
        ...message,
        metadata: {
          ...message.metadata,
          tool_calls: calls.map(call =>
            call.id === event.id
              ? {
                  ...call,
                  status: event.error ? 'error' : 'success',
                  tool_result: event.result,
                  error: event.error,
                  duration_ms: event.duration_ms,
                }
              : call
          ),
        },
      }
    case 'text_delta':
      return { ...message, content: message.content + event.text }
    case 'message_end':
      return { ...message, metadata: { ...message.metadata, streaming: false } }
  }
}

/** Ends a reply early: running tools fail as stopped and the text received so far stays. */
export function stopMessage(message: ConversationMessage): ConversationMessage {
  return {
    ...message,
    metadata: {
      ...message.metadata,
      streaming: false,
      tool_calls: toolCallsOf(message).map(call =>
        call.status === 'running' ? { ...call, status: 'error', error: 'Stopped' } : call
      ),
    },
  }
}

export interface TimedEvent {
  delay: number
  event: ChatStreamEvent
}

const FIRST_TOKEN_MS = 450
const DEFAULT_TOOL_MS = 900
const CHUNK_MS = 35
const WORDS_PER_CHUNK = 3

/**
 * Turns a canned reply into the events a live model would send.
 * shortcut: fixed timings for the demo; replace with the backend stream once the API is plugged in.
 */
export function demoEvents(reply: ConversationMessage, messageId: string): TimedEvent[] {
  const metadata = { ...reply.metadata }
  delete metadata.tool_calls
  const events: TimedEvent[] = [{ delay: 0, event: { type: 'message_start', messageId, metadata } }]
  let wait = FIRST_TOKEN_MS
  for (const call of toolCallsOf(reply)) {
    const duration = call.duration_ms ?? DEFAULT_TOOL_MS
    events.push(
      {
        delay: wait,
        event: {
          type: 'tool_start',
          call: {
            id: call.id,
            tool_name: call.tool_name,
            tool_args: call.tool_args,
            kind: call.kind,
          },
        },
      },
      {
        delay: duration,
        event: {
          type: 'tool_end',
          id: call.id,
          result: call.tool_result,
          error: call.error,
          duration_ms: duration,
        },
      }
    )
    wait = 250
  }
  const words = reply.content.match(/\S+\s*/g) ?? []
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    events.push({
      delay: i === 0 ? wait : CHUNK_MS,
      event: { type: 'text_delta', text: words.slice(i, i + WORDS_PER_CHUNK).join('') },
    })
  }
  events.push({ delay: CHUNK_MS, event: { type: 'message_end' } })
  return events
}

/** Emits each event after its delay; aborting the signal cancels whatever has not fired. */
export function playEvents(
  events: TimedEvent[],
  emit: (event: ChatStreamEvent) => void,
  signal: AbortSignal,
  onDone: () => void
) {
  let index = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const next = () => {
    if (signal.aborted) return
    if (index >= events.length) return onDone()
    const { delay, event } = events[index++]
    timer = setTimeout(() => {
      if (signal.aborted) return
      emit(event)
      next()
    }, delay)
  }
  signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
  next()
}
