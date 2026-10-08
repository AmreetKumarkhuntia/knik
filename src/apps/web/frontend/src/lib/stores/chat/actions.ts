import type { ChatStore, ChatState, ChatScope } from '$types/stores/chat'
import { EMPTY_CHAT_SCOPE } from './selectors'
export function createChatActions(set: ChatStore['setState'], get: ChatStore['getState']) {
  return {
    initializeScope: (id: string, resourceId: string | null = null) =>
      set(state => ({ scopes: { ...state.scopes, [id]: { ...EMPTY_CHAT_SCOPE, resourceId } } })),
    disposeScope: (id: string) =>
      set(state => {
        const scopes = { ...state.scopes }
        delete scopes[id]
        return { scopes }
      }),
    patchScope: (id: string, patch: Partial<ChatScope>) =>
      set(state =>
        state.scopes[id]
          ? { scopes: { ...state.scopes, [id]: { ...state.scopes[id], ...patch } } }
          : {}
      ),
    startConversation: () => {
      const id = crypto.randomUUID(),
        now = new Date().toISOString()
      set(state => ({
        conversations: [
          {
            id,
            title: 'New conversation',
            messages: [],
            created_at: now,
            updated_at: now,
            summary_message_id: null,
            compacted_count: 0,
            total_tokens: 0,
          },
          ...state.conversations,
        ],
        activeConversationId: id,
        autoTitles: { ...state.autoTitles, [id]: true },
      }))
      return id
    },
    selectConversation: (id: string | null) =>
      set(state => ({
        activeConversationId: state.conversations.some(c => c.id === id) ? id : null,
      })),
    renameConversation: (id: string, title: string) => {
      if (!title.trim()) return { ok: false as const, error: 'Enter a conversation title.' }
      if (!get().conversations.some(c => c.id === id))
        return { ok: false as const, error: 'This conversation is no longer available.' }
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, title: title.trim() } : c
        ),
        autoTitles: { ...state.autoTitles, [id]: false },
      }))
      return { ok: true as const, id }
    },
    deleteConversation: (id: string) =>
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      })),
    clearConversations: () =>
      set({ conversations: [], activeConversationId: null, autoTitles: {} }),
    beginRename: (scopeId: string, conversation: ChatState['conversations'][number]) =>
      get().patchScope(scopeId, {
        editingId: conversation.id,
        title: conversation.title || '',
        error: '',
      }),
    cancelRename: (scopeId: string) =>
      get().patchScope(scopeId, { editingId: null, title: '', error: '' }),
    saveRename: (scopeId: string) => {
      const scope = get().scopes[scopeId]
      if (!scope?.editingId) return { ok: false as const, error: 'Choose a conversation.' }
      const result = get().renameConversation(scope.editingId, scope.title)
      if (result.ok) get().cancelRename(scopeId)
      else get().patchScope(scopeId, { error: result.error })
      return result
    },
    sendMessage: (scopeId: string, modelId?: string) => {
      const scope = get().scopes[scopeId],
        prompt = scope?.draft.trim()
      const fail = (error: string) => {
        get().patchScope(scopeId, { error })
        return { ok: false as const, error }
      }
      if (!scope || !prompt) return fail('Enter a message.')
      if (scope.resourceId && !get().conversations.some(c => c.id === scope.resourceId))
        return fail('This conversation is no longer available.')
      const scenario = get().chatScenarios.find(
        s => s.prompt.trim() === prompt && (!s.modelId || s.modelId === modelId)
      )
      const replies = scenario?.replies ?? []
      const previousId = scope.resourceId ?? get().activeConversationId
      const id = previousId ?? crypto.randomUUID()
      const timestamp = new Date().toISOString()
      set(state => {
        const existing = state.conversations.find(c => c.id === id)
        const conversation = existing ?? {
          id,
          title: 'New conversation',
          messages: [],
          created_at: timestamp,
          updated_at: timestamp,
          summary_message_id: null,
          compacted_count: 0,
          total_tokens: 0,
        }
        const committed = {
          ...conversation,
          title: !existing || state.autoTitles[id] ? prompt.slice(0, 60) : conversation.title,
          messages: [
            ...conversation.messages,
            {
              id: crypto.randomUUID(),
              role: 'user' as const,
              content: prompt,
              timestamp,
              metadata: {},
            },
            ...structuredClone(replies).map(reply => ({
              ...reply,
              id: crypto.randomUUID(),
            })),
          ],
          updated_at: timestamp,
          preview: replies.at(-1)?.content ?? prompt,
          message_count: conversation.messages.length + 1 + replies.length,
        }
        return {
          conversations: existing
            ? state.conversations.map(c => (c.id === id ? committed : c))
            : [committed, ...state.conversations],
          activeConversationId: id,
          autoTitles: { ...state.autoTitles, [id]: false },
          scopes: {
            ...state.scopes,
            [scopeId]: { ...scope, draft: '', error: '', resourceId: id },
          },
        }
      })
      return { ok: true as const, id }
    },
  }
}
