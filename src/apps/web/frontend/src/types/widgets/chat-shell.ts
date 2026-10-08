import type { ReactNode } from 'react'
import type { Conversation } from '$types/conversation'
import type { DemoSuggestion } from '$types/demo-session'
import type { ShellScope } from '$types/stores/shell'

export interface MainLayoutWidgetProps {
  children: ReactNode
}
export interface SidebarWidgetProps {
  onOpenSearch: () => void
  viewport?: ShellScope['viewport']
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
  onOpenSearch: () => void
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
}
export interface SidebarAccountProps {
  collapsed: boolean
  name: string
  initials: string
  onNavigate?: () => void
}
export interface TopBarProps {
  crumbs: string[]
  right?: ReactNode
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
export interface SessionToastProps {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}
export interface CompactionDividerProps {
  summaryContent?: string
  onCopy?: (text: string) => void
}
