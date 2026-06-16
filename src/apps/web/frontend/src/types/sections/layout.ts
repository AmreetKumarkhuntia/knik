import type { ReactNode } from 'react'

/** Props for the main application layout. */
export interface MainLayoutProps {
  children: ReactNode
  onNewChat: () => void
  onSelectConversation: (conversationId: string) => void
}

/** Props for the sidebar component. */
export interface SidebarProps {
  onNewChat: () => void
  onSelectConversation: (conversationId: string) => void
  onOpenSearch: () => void
}

/** Props for the top bar command-bar. */
export interface TopBarProps {
  crumbs?: string[]
  right?: ReactNode
  onOpenSearch: () => void
  dark: boolean
  onToggleTheme: () => void
  notif?: number
}
