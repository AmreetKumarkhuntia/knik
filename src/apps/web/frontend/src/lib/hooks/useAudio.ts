import { useState, useRef, useEffect } from 'react'
import {
  setAudioStateCallback,
  stopAudio,
  clearAudioQueue,
  pauseAudio,
  resumeAudio,
} from '../../services'

export function useAudio() {
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioPaused, setAudioPaused] = useState(false)
  const streamControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setAudioStateCallback((isPaused, isPlaying) => {
      console.log('[useAudio] Audio state changed:', { isPaused, isPlaying })
      setAudioPaused(isPaused)
      setAudioPlaying(isPlaying)
    })

    return () => setAudioStateCallback(null)
  }, [])

  const handleStopAudio = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort()
      streamControllerRef.current = null
    }

    stopAudio()
    clearAudioQueue()
    setAudioPlaying(false)
  }

  const handleTogglePause = () => {
    if (audioPaused) {
      resumeAudio()
    } else {
      pauseAudio()
    }
  }

  return {
    audioPlaying,
    setAudioPlaying,
    audioPaused,
    setAudioPaused,
    streamControllerRef,
    handleStopAudio,
    handleTogglePause,
  }
}
