import type { RefObject } from 'react'

export interface HomeProps {
  setAudioPlaying: (playing: boolean) => void
  audioPlaying: boolean
  audioPaused: boolean
  streamControllerRef: RefObject<AbortController | null>
  handleStopAudio: () => void
  handleTogglePause: () => void
  success: (message: string) => void
  error: (message: string) => void
}
