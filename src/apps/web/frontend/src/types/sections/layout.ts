import type { ReactNode } from 'react'

export interface MainLayoutProps {
  children: ReactNode
  onNewChat: () => void
  onSelectConversation: (conversationId: string) => void
}

export interface SidebarProps {
  onClearHistory: () => void
  onNewChat: () => void
  onSelectConversation: (conversationId: string) => void
}

export interface TopBarProps {
  isLoading?: boolean
}
