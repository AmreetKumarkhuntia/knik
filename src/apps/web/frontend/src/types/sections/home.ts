import type { ReactNode } from 'react'

/** Props for the keyboard shortcuts modal. */
export interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

/** Props for the welcome container on the home page. */
export interface WelcomeContainerProps {
  isVisible: boolean
  children: ReactNode
}
