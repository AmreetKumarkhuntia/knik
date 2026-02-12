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

export function playAudio(base64Audio: string, _sampleRate: number = 24000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Audio] Starting playback, data length:', base64Audio.length)
      
      if (currentAudio && !currentAudio.paused) {
        console.log('[Audio] Stopping previous audio')
        currentAudio.pause()
        currentAudio = null
      }
      
      currentResolve = resolve
      
      const binaryString = atob(base64Audio)
      console.log('[Audio] Decoded binary length:', binaryString.length)
      
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: 'audio/wav' })
      console.log('[Audio] Created blob, size:', blob.size, 'type:', blob.type)
      
      const audioUrl = URL.createObjectURL(blob)
      console.log('[Audio] Created object URL:', audioUrl)
      
      const audio = new Audio(audioUrl)
      currentAudio = audio
      isPaused = false
      
      audio.onended = () => {
        console.log('[Audio] Playback ended')
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        notifyStateChange(false, false)
        resolve()
      }
      
      audio.onerror = (err) => {
        console.error('[Audio] Playback error:', err)
        URL.revokeObjectURL(audioUrl)
        currentAudio = null
        currentResolve = null
        notifyStateChange(false, false)
        reject(new Error('Audio playback failed'))
      }
      
      audio.volume = 1.0
      
      audio.play()
        .then(() => {
          console.log('[Audio] Play started successfully')
          if (mediaSessionUpdater) mediaSessionUpdater()
          notifyStateChange(false, true)
        })
        .catch((err) => {
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
  console.log('[Audio] Stopping audio')
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
    console.log('[Audio] Pausing audio')
    currentAudio.pause()
    isPaused = true
    if (mediaSessionUpdater) mediaSessionUpdater()
    notifyStateChange(true, true)
  }
}

export function resumeAudio(): void {
  if (currentAudio && currentAudio.paused && isPaused) {
    console.log('[Audio] Resuming audio')
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
