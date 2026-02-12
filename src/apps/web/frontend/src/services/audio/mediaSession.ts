/**
 * Media Session API integration for OS-level media controls
 */

import { pauseAudio, resumeAudio, stopAudio, isAudioPaused } from './playback'

export function updateMediaSession(): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Knik AI Assistant',
      artist: 'AI Response',
      artwork: [
        { src: '/favicon.ico', sizes: '96x96', type: 'image/x-icon' }
      ]
    })

    navigator.mediaSession.setActionHandler('play', () => {
      console.log('[Media Session] Play requested')
      resumeAudio()
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('[Media Session] Pause requested')
      pauseAudio()
    })

    navigator.mediaSession.setActionHandler('stop', () => {
      console.log('[Media Session] Stop requested')
      stopAudio()
    })

    navigator.mediaSession.playbackState = isAudioPaused() ? 'paused' : 'playing'
  }
}

export function clearMediaSession(): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none'
    navigator.mediaSession.metadata = null
  }
}
