import type { ChatScope, ChatState } from '$types/stores/chat'
export const EMPTY_CHAT_SCOPE: ChatScope = {
  resourceId: null,
  draft: '',
  shortcutsOpen: false,
  error: '',
  editingId: null,
  deletingId: null,
  title: '',
}
export const selectRecentConversations = (state: Pick<ChatState, 'conversations'>) =>
  [...state.conversations].sort(
    (a, b) =>
      (Date.parse(b.updated_at || b.created_at || '') || 0) -
      (Date.parse(a.updated_at || a.created_at || '') || 0)
  )
export const selectActiveConversation = (state: ChatState) =>
  state.conversations.find(conversation => conversation.id === state.activeConversationId)
