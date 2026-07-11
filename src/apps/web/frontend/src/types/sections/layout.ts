import type { ReactNode } from 'react'
import type { Conversation } from '$types/api'

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

/** Props for the sidebar brand / collapse toggle. */
export interface SidebarBrandProps {
  collapsed: boolean
  onToggle: () => void
}

/** Props for the sidebar quick-actions (new chat + search). */
export interface SidebarQuickActionsProps {
  collapsed: boolean
  onNewChat: () => void
  onOpenSearch: () => void
}

/** Props for the sidebar workspace nav. */
export interface SidebarNavProps {
  collapsed: boolean
}

/** Props for the sidebar recent-conversations list. */
export interface SidebarRecentsProps {
  conversations: Conversation[]
  loading: boolean
  onSelect: (id: string) => void
  onRename: (conv: Conversation) => void
  onDelete: (conv: Conversation) => void
}

/** Props for the sidebar account footer. */
export interface SidebarAccountProps {
  collapsed: boolean
}
