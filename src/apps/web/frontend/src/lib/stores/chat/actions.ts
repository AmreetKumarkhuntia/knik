import type { ChatStore, ChatState, ChatScope } from '$types/stores/chat'
import { EMPTY_CHAT_SCOPE } from './selectors'
import { generateId } from '$utils/uuid'
import type { ChatStreamEvent, ConversationMessage } from '$types/conversation'
import { applyStreamEvent, demoEvents, playEvents, stopMessage } from './stream'
export function createChatActions(set: ChatStore['setState'], get: ChatStore['getState']) {
  // Live replies per conversation; AbortControllers are not state, so they stay out of the store.
  const streams = new Map<string, AbortController>()
  const updateMessage = (
    conversationId: string,
    messageId: string,
    update: (message: ConversationMessage) => ConversationMessage
  ) =>
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: c.messages.map(m => (m.id === messageId ? update(m) : m)) }
          : c
      ),
    }))
  const finishStream = (conversationId: string) => {
    streams.delete(conversationId)
    set(state => {
      const streaming = { ...state.streaming }
      delete streaming[conversationId]
      return { streaming }
    })
  }
  const abortStream = (conversationId: string) => {
    streams.get(conversationId)?.abort()
    streams.delete(conversationId)
  }
  const streamReplies = (
    conversationId: string,
    replies: ConversationMessage[],
    timestamp: string
  ) => {
    const controller = new AbortController()
    streams.set(conversationId, controller)
    let messageId = ''
    const emit = (event: ChatStreamEvent) => {
      if (event.type === 'message_start') {
        messageId = event.messageId
        const message: ConversationMessage = {
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp,
          metadata: {},
        }
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, applyStreamEvent(message, event)],
                  message_count: c.messages.length + 1,
                }
              : c
          ),
        }))
        return
      }
      updateMessage(conversationId, messageId, message => applyStreamEvent(message, event))
      if (event.type === 'message_end')
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? { ...c, preview: c.messages.find(m => m.id === messageId)?.content ?? c.preview }
              : c
          ),
        }))
    }
    playEvents(
      replies.flatMap(reply => demoEvents(reply, generateId())),
      emit,
      controller.signal,
      () => finishStream(conversationId)
    )
  }
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
      const { conversations, autoTitles } = get()
      // Reuse an untouched blank chat so repeated "New chat" clicks don't pile up empty Recents.
      const blank = conversations.find(c => c.messages.length === 0 && autoTitles[c.id])
      const id = blank?.id ?? generateId(),
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
          ...state.conversations.filter(c => c.id !== id),
        ],
        activeConversationId: id,
        autoTitles: { ...state.autoTitles, [id]: true },
        // Reusing the open blank chat keeps its session mounted, so reset the composer bound to it.
        scopes: Object.fromEntries(
          Object.entries(state.scopes).map(([key, scope]) => [
            key,
            scope?.resourceId === id ? { ...EMPTY_CHAT_SCOPE, resourceId: id } : scope,
          ])
        ),
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
    deleteConversation: (id: string) => {
      abortStream(id)
      set(state => {
        const streaming = { ...state.streaming }
        delete streaming[id]
        return {
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
          streaming,
        }
      })
    },
    clearConversations: () => {
      for (const id of streams.keys()) abortStream(id)
      set({ conversations: [], activeConversationId: null, autoTitles: {}, streaming: {} })
    },
    stopStreaming: (conversationId: string) => {
      if (!streams.has(conversationId)) return
      abortStream(conversationId)
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map(m => (m.metadata.streaming ? stopMessage(m) : m)),
              }
            : c
        ),
      }))
      finishStream(conversationId)
    },
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
      if (get().streaming[scope.resourceId ?? get().activeConversationId ?? ''])
        return fail('Wait for the reply to finish, or stop it.')
      const scenario = get().chatScenarios.find(
        s => s.prompt.trim() === prompt && (!s.modelId || s.modelId === modelId)
      )
      const replies = scenario?.replies ?? []
      const previousId = scope.resourceId ?? get().activeConversationId
      const id = previousId ?? generateId()
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
              id: generateId(),
              role: 'user' as const,
              content: prompt,
              timestamp,
              metadata: {},
            },
          ],
          updated_at: timestamp,
          preview: prompt,
          message_count: conversation.messages.length + 1,
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
          streaming: replies.length ? { ...state.streaming, [id]: true } : state.streaming,
        }
      })
      if (replies.length) streamReplies(id, structuredClone(replies), timestamp)
      return { ok: true as const, id }
    },
  }
}
