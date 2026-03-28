import { pauseAudio, resumeAudio, stopAudio, isAudioPaused } from './playback'

/** Updates the browser Media Session API with playback metadata and action handlers. */
export function updateMediaSession(): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Knik AI Assistant',
      artist: 'AI Response',
      artwork: [{ src: '/favicon.ico', sizes: '96x96', type: 'image/x-icon' }],
    })

    navigator.mediaSession.setActionHandler('play', () => {
      resumeAudio()
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      pauseAudio()
    })

    navigator.mediaSession.setActionHandler('stop', () => {
      stopAudio()
    })

    navigator.mediaSession.playbackState = isAudioPaused() ? 'paused' : 'playing'
  }
}

/** Clears the browser Media Session metadata and stops playback state. */
export function clearMediaSession(): void {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none'
    navigator.mediaSession.metadata = null
  }
}
