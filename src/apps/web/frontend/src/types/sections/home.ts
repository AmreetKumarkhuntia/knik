import type { ReactNode } from 'react'

export interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export interface SuggestionCardsProps {
  onSelectPrompt: (prompt: string) => void
}

export interface WelcomeContainerProps {
  isVisible: boolean
  children: ReactNode
}
