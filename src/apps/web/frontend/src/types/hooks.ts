import type { RefObject } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface UseChatProps {
  setAudioPlaying: (playing: boolean) => void
  streamControllerRef: RefObject<AbortController | null>
  success: (msg: string) => void
  error: (msg: string) => void
}

export interface UseChatReturn {
  messages: Message[]
  inputText: string
  setInputText: (text: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  conversationId: string | null
  handleNewChat: () => void
  handleClearHistory: () => void
  handleSend: () => Promise<void>
  loadConversation: (id: string) => Promise<void>
}

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
}
