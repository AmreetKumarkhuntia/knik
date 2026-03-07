import type { ReactNode } from 'react'
import type { ToastType } from '$types/components'

export interface MainLayoutProps {
  children: ReactNode
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toasts: Array<{ id: number; message: string; type: ToastType }>
  hideToast: (id: number) => void
  onNewChat: () => void
  onClearHistory: () => void
}

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onClearHistory: () => void
  onNewChat: () => void
}

export interface TopBarProps {
  isLoading?: boolean
}
