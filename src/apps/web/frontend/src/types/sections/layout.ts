import type { ReactNode } from 'react'

/** Props for the main application layout. */
export interface MainLayoutProps {
  children: ReactNode
  onNewChat: () => void
  onSelectConversation: (conversationId: string) => void
}

/** Props for the sidebar component. */
export interface SidebarProps {
  onClearHistory: () => void
  onNewChat: () => void
  onSelectConversation: (conversationId: string) => void
}

/** Props for the top bar component. */
export interface TopBarProps {
  isLoading?: boolean
}
