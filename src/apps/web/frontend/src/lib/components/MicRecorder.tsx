import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export interface MicRecorderProps {
  onRecordComplete: (blob: Blob) => void
  maxDuration?: number // in seconds
  className?: string
}

export default function MicRecorder({
  onRecordComplete,
  maxDuration = 60,
  className = '',
}: MicRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecordComplete(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      timerRef.current = window.setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return maxDuration
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      void startRecording()
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <button
        onClick={toggleRecording}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full transition-all
          ${isRecording ? 'bg-error/10 text-error' : 'bg-surface-2 text-fg-2 hover:bg-surface-3'}
        `}
      >
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-error"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <span className="material-symbols-outlined text-[32px]">
          {isRecording ? 'stop' : 'mic'}
        </span>
      </button>

      {isRecording && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 h-8">
            {/* Fake waveform for visual feedback */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-error rounded-full"
                animate={{ height: ['20%', '100%', '20%'] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <span className="text-sm font-mono text-fg-3">
            00:{duration.toString().padStart(2, '0')} / 00:{maxDuration.toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  )
}
