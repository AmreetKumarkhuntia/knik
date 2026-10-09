import type { ReactNode } from 'react'
import type { Conversation, ConversationMessage } from '$types/conversation'
import type { AgentThinkingStep } from '$types/components/chat'
import type { DemoSuggestion } from '$types/demo-session'
import type { Viewport } from '$types/stores/shell'

export interface MainLayoutWidgetProps {
  children: ReactNode
}
export interface SidebarWidgetProps {
  viewport?: Viewport
  mobileOpen?: boolean
  onCloseMobile?: () => void
}
export interface SidebarBrandProps {
  collapsed: boolean
  onToggle?: () => void
}
export interface SidebarQuickActionsProps {
  collapsed: boolean
  onNewChat: () => void
}
export interface SidebarNavProps {
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
}
export interface SidebarRecentsProps {
  conversations: Conversation[]
  loading: boolean
  onSelect: (id: string) => void
  onRename: (conversation: Conversation) => void
  onDelete: (conversation: Conversation) => void
  activeConversationId?: string | null
}
export interface SidebarAccountProps {
  collapsed: boolean
  name: string
  initials: string
  onNavigate?: () => void
}
export interface TopBarProps {
  crumbs: string[]
  onOpenSearch: () => void
  dark: boolean
  onToggleTheme: () => void
  onOpenNavigation?: () => void
}
export interface SuggestionCardsProps {
  suggestions: DemoSuggestion[]
  onSelectPrompt: (prompt: string) => void
}
export interface FullScreenErrorViewProps {
  message: string
  title?: string
  onBack?: () => void
  onRetry?: () => void
  layout: 'screen' | 'fill'
}
export interface CompactionDividerProps {
  summaryContent?: string
  onCopy?: (text: string) => void
}
export interface ChatTranscriptMessage extends ConversationMessage {
  timestampLabel: string
  isUser: boolean
  steps: AgentThinkingStep[]
  modelTag?: string
  messageId: string
}
export interface ChatTranscriptProps {
  messages: ChatTranscriptMessage[]
  initials: string
  summaryMessageId?: string | null
  onCopy: (text: string) => void
}
