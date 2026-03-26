import type { StateCreator } from 'zustand'
import {
  setAudioStateCallback,
  stopAudio,
  clearAudioQueue,
  pauseAudio,
  resumeAudio,
} from '$services/index'

export interface AudioSlice {
  // State
  audioPlaying: boolean
  audioPaused: boolean
  streamControllerRef: AbortController | null

  // Actions
  setAudioPlaying: (playing: boolean) => void
  setAudioPaused: (paused: boolean) => void
  setStreamController: (controller: AbortController | null) => void
  handleStopAudio: () => void
  handleTogglePause: () => void
  initAudioCallbacks: () => () => void
}

export const createAudioSlice: StateCreator<AudioSlice, [], [], AudioSlice> = (set, get) => ({
  // State
  audioPlaying: false,
  audioPaused: false,
  streamControllerRef: null,

  // Actions
  setAudioPlaying: (playing: boolean) => set({ audioPlaying: playing }),
  setAudioPaused: (paused: boolean) => set({ audioPaused: paused }),
  setStreamController: (controller: AbortController | null) =>
    set({ streamControllerRef: controller }),

  handleStopAudio: () => {
    const { streamControllerRef } = get()
    if (streamControllerRef) {
      streamControllerRef.abort()
      set({ streamControllerRef: null })
    }
    stopAudio()
    clearAudioQueue()
    set({ audioPlaying: false })
  },

  handleTogglePause: () => {
    const { audioPaused } = get()
    if (audioPaused) {
      resumeAudio()
    } else {
      pauseAudio()
    }
  },

  /**
   * Initialize the audio state callback that syncs the audio service
   * state back into the store. Returns a cleanup function.
   */
  initAudioCallbacks: () => {
    setAudioStateCallback((isPaused: boolean, isPlaying: boolean) => {
      set({ audioPaused: isPaused, audioPlaying: isPlaying })
    })
    return () => setAudioStateCallback(null)
  },
})
