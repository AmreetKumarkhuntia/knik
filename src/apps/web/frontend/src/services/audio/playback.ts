/**
 * Core audio playback functionality
 */

import type { updateMediaSession as UpdateMediaSessionFn } from './mediaSession'

let currentAudio: HTMLAudioElement | null = null
let currentResolve: (() => void) | null = null
let isPaused = false

type StateCallback = (isPaused: boolean, isPlaying: boolean) => void
let stateCallback: StateCallback | null = null
let mediaSessionUpdater: typeof UpdateMediaSessionFn | null = null

export function setMediaSessionUpdater(updater: typeof UpdateMediaSessionFn): void {
  mediaSessionUpdater = updater
}

export function setAudioStateCallback(callback: StateCallback | null): void {
  stateCallback = callback
}

export function notifyStateChange(isPaused: boolean, isPlaying: boolean): void {
  if (stateCallback) stateCallback(isPaused, isPlaying)
}

export function playAudio(
  base64Audio: string,
  _sampleRate: number = 24000,
  getQueueSize: () => number = () => 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (currentAudio && !currentAudio.paused) {
        currentAudio.pause()
        currentAudio = null
      }

      currentResolve = resolve

      const binaryString = atob(base64Audio)

      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      currentAudio = audio
      isPaused = false

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        if (getQueueSize() === 0) {
          notifyStateChange(false, false)
        }
        resolve()
      }

      audio.onerror = err => {
        console.error('[Audio] Playback error:', err)
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        notifyStateChange(false, false)
        reject(new Error('Audio playback failed'))
      }

      audio.volume = 1.0

      audio
        .play()
        .then(() => {
          if (mediaSessionUpdater) mediaSessionUpdater()
          notifyStateChange(false, true)
        })
        .catch(err => {
          console.error('[Audio] Play failed:', err)
          reject(err)
        })
    } catch (error) {
      console.error('[Audio] Exception:', error)
      reject(error)
    }
  })
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  if (currentResolve) {
    currentResolve()
    currentResolve = null
  }

  isPaused = false
  notifyStateChange(false, false)
}

export function pauseAudio(): void {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause()
    isPaused = true
    if (mediaSessionUpdater) mediaSessionUpdater()
    notifyStateChange(true, true)
  }
}

export function resumeAudio(): void {
  if (currentAudio && currentAudio.paused && isPaused) {
    currentAudio.play().catch(err => console.error('[Audio] Resume failed:', err))
    isPaused = false
    if (mediaSessionUpdater) mediaSessionUpdater()
    notifyStateChange(false, true)
  }
}

export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused
}

export function isAudioPaused(): boolean {
  return isPaused
}

export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudio
}
