import { useEffect, useRef, useState } from 'react'
import type { UseMicRecorderOptions, UseMicRecorderResult } from '../../types/hooks'

/**
 * Owns microphone capture: getUserMedia, MediaRecorder, the elapsed-seconds
 * timer, and unmount cleanup. Device selection is the caller's concern — pass
 * `deviceId` to capture a specific input; omitted, the browser/OS default is
 * used via the permission prompt. The MicRecorder component stays pure UI.
 */
export function useMicRecorder(options: UseMicRecorderOptions = {}): UseMicRecorderResult {
  const { deviceId, maxDuration = 60, onComplete } = options
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  const stop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const start = () => {
    void (async () => {
      try {
        setError(null)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId } : true,
        })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          onComplete?.(blob)
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setRecording(true)
        setSeconds(0)

        timerRef.current = window.setInterval(() => {
          setSeconds(prev => {
            if (prev >= maxDuration - 1) {
              stop()
              return maxDuration
            }
            return prev + 1
          })
        }, 1000)
      } catch (err) {
        console.error('Failed to start recording', err)
        setError('Failed to start recording')
      }
    })()
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return { recording, seconds, start, stop, error }
}
