import { afterEach, describe, expect, it, vi } from 'vitest'
import { createChatStore } from '$stores/chat/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
import { applyStreamEvent, demoEvents, stopMessage, toolCallsOf } from '$stores/chat/stream'
import type { ConversationMessage, ToolCall } from '$types/conversation'

const calls: ToolCall[] = [
  {
    id: 'search',
    tool_name: 'web_search',
    tool_args: { q: 'knik' },
    tool_result: { hits: 2 },
    kind: 'mcp',
    duration_ms: 500,
  },
  {
    id: 'lint',
    tool_name: 'lint',
    tool_args: {},
    error: 'Exit 1',
    duration_ms: 300,
  },
]
const reply: ConversationMessage = {
  id: 'reply',
  role: 'assistant',
  content: 'one two three four five',
  timestamp: '2026-10-08T12:00:00Z',
  metadata: { model: 'demo', tool_calls: calls },
}
const blank: ConversationMessage = {
  id: 'm',
  role: 'assistant',
  content: '',
  timestamp: '',
  metadata: {},
}

function setup() {
  const store = createChatStore(
    normalizeDemoSource({
      chatScenarios: [{ prompt: 'Hello', replies: [reply] }],
      conversations: [],
      activeConversationId: null,
    })
  )
  store.getState().initializeScope('composer')
  store.getState().patchScope('composer', { draft: 'Hello' })
  const result = store.getState().sendMessage('composer')
  const id = result.ok ? String(result.id) : ''
  const conversation = () => store.getState().conversations.find(c => c.id === id)!
  const assistant = () => conversation().messages.at(-1)!
  return { store, id, conversation, assistant }
}

afterEach(() => vi.useRealTimers())

describe('applyStreamEvent', () => {
  it('folds tool, text and end events into the message', () => {
    let message = applyStreamEvent(blank, {
      type: 'message_start',
      messageId: 'm',
      metadata: { model: 'x' },
    })
    message = applyStreamEvent(message, {
      type: 'tool_start',
      call: { id: 't', tool_name: 'read', tool_args: { path: 'a' } },
    })
    expect(toolCallsOf(message)).toEqual([
      { id: 't', tool_name: 'read', tool_args: { path: 'a' }, status: 'running' },
    ])
    message = applyStreamEvent(message, { type: 'tool_end', id: 't', result: 'ok', duration_ms: 5 })
    message = applyStreamEvent(message, { type: 'text_delta', text: 'Hi ' })
    message = applyStreamEvent(message, { type: 'text_delta', text: 'there' })
    message = applyStreamEvent(message, { type: 'message_end' })
    expect(message.content).toBe('Hi there')
    expect(message.metadata).toMatchObject({ model: 'x', streaming: false })
    expect(toolCallsOf(message)[0]).toMatchObject({ status: 'success', tool_result: 'ok' })
  })

  it('marks a tool that ends with an error as failed', () => {
    const message = applyStreamEvent(
      applyStreamEvent(blank, {
        type: 'tool_start',
        call: { id: 't', tool_name: 'x', tool_args: {} },
      }),
      { type: 'tool_end', id: 't', error: 'boom', duration_ms: 1 }
    )
    expect(toolCallsOf(message)[0]).toMatchObject({ status: 'error', error: 'boom' })
  })

  it('stops running tools without touching finished ones', () => {
    const message = stopMessage({
      ...blank,
      metadata: {
        streaming: true,
        tool_calls: [
          { id: 'a', tool_name: 'a', tool_args: {}, status: 'success' },
          { id: 'b', tool_name: 'b', tool_args: {}, status: 'running' },
        ],
      },
    })
    expect(message.metadata.streaming).toBe(false)
    expect(toolCallsOf(message).map(call => [call.status, call.error])).toEqual([
      ['success', undefined],
      ['error', 'Stopped'],
    ])
  })

  it('replays a reply as start, tools, chunked text and end', () => {
    expect(demoEvents(reply, 'm').map(({ event }) => event.type)).toEqual([
      'message_start',
      'tool_start',
      'tool_end',
      'tool_start',
      'tool_end',
      'text_delta',
      'text_delta',
      'message_end',
    ])
  })
})

describe('chat streaming', () => {
  it('shows running tools, then results, then streamed text', () => {
    vi.useFakeTimers()
    const { store, id, assistant } = setup()
    expect(store.getState().streaming[id]).toBe(true)

    vi.advanceTimersByTime(0)
    expect(assistant()).toMatchObject({ role: 'assistant', content: '' })
    expect(assistant().metadata.streaming).toBe(true)

    vi.advanceTimersByTime(450)
    expect(toolCallsOf(assistant())[0].status).toBe('running')
    vi.advanceTimersByTime(500)
    expect(toolCallsOf(assistant())[0]).toMatchObject({
      status: 'success',
      tool_result: { hits: 2 },
    })

    vi.runAllTimers()
    expect(assistant().content).toBe(reply.content)
    expect(toolCallsOf(assistant()).map(call => call.status)).toEqual(['success', 'error'])
    expect(assistant().metadata).toMatchObject({ model: 'demo', streaming: false })
    expect(store.getState().streaming[id]).toBeUndefined()
  })

  it('blocks a second send while a reply is still arriving', () => {
    vi.useFakeTimers()
    const { store } = setup()
    store.getState().patchScope('composer', { draft: 'Again' })
    expect(store.getState().sendMessage('composer').ok).toBe(false)
    vi.runAllTimers()
    expect(store.getState().sendMessage('composer').ok).toBe(true)
  })

  it('stops mid-stream, keeping text so far and failing the running tool', () => {
    vi.useFakeTimers()
    const { store, id, assistant } = setup()
    vi.advanceTimersByTime(600)
    store.getState().stopStreaming(id)
    vi.runAllTimers()
    expect(assistant().content).toBe('')
    expect(assistant().metadata.streaming).toBe(false)
    expect(toolCallsOf(assistant())).toEqual([
      expect.objectContaining({ id: 'search', status: 'error', error: 'Stopped' }),
    ])
    expect(store.getState().streaming[id]).toBeUndefined()
  })

  it('cancels the stream when the conversation is deleted', () => {
    vi.useFakeTimers()
    const { store, id } = setup()
    vi.advanceTimersByTime(500)
    store.getState().deleteConversation(id)
    vi.runAllTimers()
    expect(store.getState().conversations).toEqual([])
    expect(store.getState().streaming).toEqual({})
  })
})
