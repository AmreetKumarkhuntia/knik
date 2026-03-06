import type { RefObject } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface UseChatProps {
  setAudioPlaying: (playing: boolean) => void
  streamControllerRef: RefObject<AbortController | null>
  success: (msg: string) => void
  error: (msg: string) => void
}

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
}
