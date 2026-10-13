import type { ChatStore, ChatState, ChatScope } from '$types/stores/chat'
import { EMPTY_CHAT_SCOPE } from './selectors'
import { generateId } from '$utils/uuid'
import { omit } from '$utils/omit'
import type { ChatStreamEvent, Conversation, ConversationMessage } from '$types/conversation'
import { scopeSlice } from '../session/scopes'
import { applyStreamEvent, demoEvents, playEvents, stopMessage } from './stream'
const blankConversation = (id: string, now: string): Conversation => ({
  id,
  title: 'New conversation',
  messages: [],
  created_at: now,
  updated_at: now,
  summary_message_id: null,
  compacted_count: 0,
  total_tokens: 0,
})
export function createChatActions(set: ChatStore['setState'], get: ChatStore['getState']) {
  const scopes = scopeSlice<ChatState, ChatScope>(set)
  // Live replies per conversation; AbortControllers are not state, so they stay out of the store.
  const streams = new Map<string, AbortController>()
  const patchConversation = (id: string, change: (conversation: Conversation) => Conversation) =>
    set(state => ({
      conversations: state.conversations.map(c => (c.id === id ? change(c) : c)),
    }))
  const updateMessage = (
    conversationId: string,
    messageId: string,
    update: (message: ConversationMessage) => ConversationMessage
  ) =>
    patchConversation(conversationId, c => ({
      ...c,
      messages: c.messages.map(m => (m.id === messageId ? update(m) : m)),
    }))
  const finishStream = (conversationId: string) => {
    streams.delete(conversationId)
    set(state => ({ streaming: omit(state.streaming, conversationId) }))
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
        patchConversation(conversationId, c => ({
          ...c,
          messages: [...c.messages, applyStreamEvent(message, event)],
          message_count: c.messages.length + 1,
        }))
        return
      }
      updateMessage(conversationId, messageId, message => applyStreamEvent(message, event))
      if (event.type === 'message_end')
        patchConversation(conversationId, c => ({
          ...c,
          preview: c.messages.find(m => m.id === messageId)?.content ?? c.preview,
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
      scopes.init(id, { ...EMPTY_CHAT_SCOPE, resourceId }),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    startConversation: () => {
      const { conversations, autoTitles } = get()
      // Reuse an untouched blank chat so repeated "New chat" clicks don't pile up empty Recents.
      const blank = conversations.find(c => c.messages.length === 0 && autoTitles[c.id])
      const id = blank?.id ?? generateId(),
        now = new Date().toISOString()
      set(state => ({
        conversations: [
          blankConversation(id, now),
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
      patchConversation(id, c => ({ ...c, title: title.trim() }))
      set(state => ({ autoTitles: { ...state.autoTitles, [id]: false } }))
      return { ok: true as const, id }
    },
    deleteConversation: (id: string) => {
      abortStream(id)
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== id),
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        streaming: omit(state.streaming, id),
      }))
    },
    clearConversations: () => {
      for (const id of streams.keys()) abortStream(id)
      set({ conversations: [], activeConversationId: null, autoTitles: {}, streaming: {} })
    },
    stopStreaming: (conversationId: string) => {
      if (!streams.has(conversationId)) return
      abortStream(conversationId)
      patchConversation(conversationId, c => ({
        ...c,
        messages: c.messages.map(m => (m.metadata.streaming ? stopMessage(m) : m)),
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
      if (!scope || !prompt) return scopes.fail(scopeId, 'Enter a message.')
      if (scope.resourceId && !get().conversations.some(c => c.id === scope.resourceId))
        return scopes.fail(scopeId, 'This conversation is no longer available.')
      if (get().streaming[scope.resourceId ?? get().activeConversationId ?? ''])
        return scopes.fail(scopeId, 'Wait for the reply to finish, or stop it.')
      const scenario = get().chatScenarios.find(
        s => s.prompt.trim() === prompt && (!s.modelId || s.modelId === modelId)
      )
      const replies = scenario?.replies ?? []
      const previousId = scope.resourceId ?? get().activeConversationId
      const id = previousId ?? generateId()
      const timestamp = new Date().toISOString()
      set(state => {
        const existing = state.conversations.find(c => c.id === id)
        const conversation = existing ?? blankConversation(id, timestamp)
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
