import { describe, expect, it } from 'vitest'
import { createChatStore } from '$stores/chat/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
import { selectRecentConversations } from '$stores/chat/selectors'

const seed = () =>
  normalizeDemoSource({
    chatScenarios: [
      {
        prompt: 'Hello',
        modelId: 'demo',
        replies: [
          {
            id: 'reply',
            role: 'assistant',
            content: 'Supplied answer',
            timestamp: '2026-10-08T12:00:00Z',
            metadata: {},
          },
        ],
      },
    ],
  })
describe('chat store', () => {
  it('keeps simultaneous drafts isolated and retains invalid drafts', () => {
    const store = createChatStore(seed())
    store.getState().initializeScope('left')
    store.getState().initializeScope('right')
    store.getState().patchScope('left', { draft: '   ' })
    store.getState().patchScope('right', { draft: 'Hello' })
    expect(store.getState().sendMessage('left', 'demo')).toEqual({
      ok: false,
      error: 'Enter a message.',
    })
    expect(store.getState().scopes.left!.draft).toBe('   ')
    expect(store.getState().scopes.right!.error).toBe('')
    store.getState().disposeScope('left')
    expect(store.getState().scopes.left).toBeUndefined()
    expect(store.getState().scopes.right!.draft).toBe('Hello')
  })
  it.each([
    ['Refactor my Python scriptvasca', 'demo'],
    ['Hello', 'different-model'],
    ['Hello', undefined],
  ])('saves %s with model %s without requiring a matching reply', (draft, modelId) => {
    const store = createChatStore(seed())
    store.getState().initializeScope('composer')
    store.getState().patchScope('composer', { draft })
    expect(store.getState().sendMessage('composer', modelId)).toMatchObject({ ok: true })
    expect(store.getState().scopes.composer).toMatchObject({ draft: '', error: '' })
    expect(store.getState().conversations[0].messages).toEqual([
      expect.objectContaining({ role: 'user', content: draft }),
    ])
    expect(store.getState().conversations[0].preview).toBe(draft)
  })
  it('preserves explicit titles when the first message is sent and clears only the sent draft', () => {
    const source = seed(),
      store = createChatStore(source)
    const id = store.getState().startConversation()
    store.getState().renameConversation(id, 'My saved title')
    store.getState().initializeScope('composer', id)
    store.getState().patchScope('composer', { draft: 'Hello' })
    expect(store.getState().sendMessage('composer', 'demo')).toEqual({ ok: true, id })
    expect(store.getState().conversations[0].title).toBe('My saved title')
    expect(store.getState().conversations[0].messages.map(message => message.content)).toEqual([
      'Hello',
      'Supplied answer',
    ])
    expect(store.getState().scopes.composer!.draft).toBe('')
    expect(source.conversations).toHaveLength(0)
    expect(source.chatScenarios[0].replies[0].id).toBe('reply')
  })
  it('rejects sending to a deleted conversation without creating another', () => {
    const store = createChatStore(seed()),
      id = store.getState().startConversation()
    store.getState().initializeScope('composer', id)
    store.getState().patchScope('composer', { draft: 'Hello' })
    store.getState().deleteConversation(id)
    expect(store.getState().sendMessage('composer', 'demo').ok).toBe(false)
    expect(store.getState().conversations).toHaveLength(0)
    expect(store.getState().scopes.composer!.draft).toBe('Hello')
  })
  it('sorts recents by latest activity without mutating stored order', () => {
    const store = createChatStore(seed()),
      first = store.getState().startConversation(),
      second = store.getState().startConversation()
    store.getState().initializeScope('composer', first)
    store.getState().patchScope('composer', { draft: 'Hello' })
    store.getState().sendMessage('composer', 'demo')
    store.setState(state => ({
      conversations: state.conversations.map(c => ({
        ...c,
        updated_at: c.id === first ? '2026-10-08T13:00:00Z' : '2026-10-08T12:00:00Z',
      })),
    }))
    expect(selectRecentConversations(store.getState()).map(c => c.id)).toEqual([first, second])
    expect(store.getState().conversations.map(c => c.id)).toEqual([second, first])
  })
  it('seeds independent sessions and resets committed chats on recreation', () => {
    const source = seed(),
      first = createChatStore(source),
      second = createChatStore(source)
    first.getState().startConversation()
    expect(second.getState().conversations).toHaveLength(0)
    expect(createChatStore(source).getState().conversations).toHaveLength(0)
  })
})
