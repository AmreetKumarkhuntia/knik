import type { StoreApi } from 'zustand/vanilla'
import type { Conversation } from '$types/conversation'
import type { DemoSnapshot, DemoActionResult } from '$types/demo-session'
import type { ScopeState } from './scope'

export interface ChatScope {
  resourceId: string | null
  draft: string
  shortcutsOpen: boolean
  toolsOpen: boolean
  error: string
  editingId: string | null
  deletingId: string | null
  title: string
}
export interface ChatState
  extends
    Pick<DemoSnapshot, 'conversations' | 'activeConversationId' | 'chatScenarios'>,
    ScopeState<ChatScope, [resourceId?: string | null]> {
  autoTitles: Record<string, boolean>
  /** Conversations with a reply still arriving. */
  streaming: Record<string, boolean>
  startConversation: () => string
  selectConversation: (id: string | null) => void
  renameConversation: (id: string, title: string) => DemoActionResult
  deleteConversation: (id: string) => void
  clearConversations: () => void
  beginRename: (scopeId: string, conversation: Conversation) => void
  cancelRename: (scopeId: string) => void
  saveRename: (scopeId: string) => DemoActionResult
  sendMessage: (scopeId: string, modelId?: string) => DemoActionResult
  stopStreaming: (conversationId: string) => void
}
export type ChatStore = StoreApi<ChatState>
