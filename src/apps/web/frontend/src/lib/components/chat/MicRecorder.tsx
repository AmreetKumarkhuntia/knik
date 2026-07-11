import { motion } from 'framer-motion'
import type { MicRecorderProps } from '$types'

/** Pure mic-button UI. Capture is owned by the caller (see $hooks/useMicRecorder). */
export default function MicRecorder({
  recording,
  seconds,
  maxDuration = 60,
  onStart,
  onStop,
  className = '',
}: MicRecorderProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <button
        onClick={() => (recording ? onStop() : onStart())}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full transition-all
          ${recording ? 'bg-error/10 text-error' : 'bg-surface-2 text-fg-2 hover:bg-surface-3'}
        `}
      >
        {recording && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-error"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <span className="material-symbols-outlined text-[32px]">{recording ? 'stop' : 'mic'}</span>
      </button>

      {recording && (
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
            00:{seconds.toString().padStart(2, '0')} / 00:{maxDuration.toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  )
}
