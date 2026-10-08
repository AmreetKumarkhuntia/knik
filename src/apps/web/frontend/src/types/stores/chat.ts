import type { StoreApi } from 'zustand/vanilla'
import type { Conversation } from '$types/conversation'
import type { DemoSnapshot, DemoActionResult } from '$types/demo-session'

export interface ChatScope {
  resourceId: string | null
  draft: string
  shortcutsOpen: boolean
  error: string
  editingId: string | null
  deletingId: string | null
  title: string
}
export interface ChatState extends Pick<
  DemoSnapshot,
  'conversations' | 'activeConversationId' | 'chatScenarios'
> {
  scopes: Partial<Record<string, ChatScope>>
  autoTitles: Record<string, boolean>
  initializeScope: (id: string, resourceId?: string | null) => void
  disposeScope: (id: string) => void
  patchScope: (id: string, patch: Partial<ChatScope>) => void
  startConversation: () => string
  selectConversation: (id: string | null) => void
  renameConversation: (id: string, title: string) => DemoActionResult
  deleteConversation: (id: string) => void
  clearConversations: () => void
  beginRename: (scopeId: string, conversation: Conversation) => void
  cancelRename: (scopeId: string) => void
  saveRename: (scopeId: string) => DemoActionResult
  sendMessage: (scopeId: string, modelId?: string) => DemoActionResult
}
export type ChatStore = StoreApi<ChatState>
