import type { ReactNode } from 'react'
import type { ToastType } from '$types/components'

export interface MainLayoutProps {
  children: ReactNode
  toasts: Array<{ id: number; message: string; type: ToastType }>
  hideToast: (id: number) => void
  onNewChat: () => void
  onClearHistory: () => void
}

export interface SidebarProps {
  onClearHistory: () => void
  onNewChat: () => void
}

export interface TopBarProps {
  isLoading?: boolean
}
