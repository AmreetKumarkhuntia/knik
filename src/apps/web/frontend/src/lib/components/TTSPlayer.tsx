import React, { useState } from 'react'

export interface TTSPlayerProps {
  audioSrc?: string
  voiceName?: string
  text?: string
  className?: string
}

const WAVE_BARS = [
  8, 14, 18, 22, 20, 24, 18, 12, 20, 26, 22, 16, 10, 14, 22, 28, 24, 20, 14, 10, 16, 22, 26, 20, 18,
  14, 24, 20, 12, 16, 22, 18, 14, 20, 24, 28, 14, 18, 22, 16, 12, 20, 24, 18, 14, 10, 8, 14, 18, 22,
  14, 10, 16, 20, 14, 8, 6,
]

export default function TTSPlayer({
  voiceName = 'af_heart',
  text = '"How can I help you today?"',
  className = '',
}: TTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const playedCount = 35 // Mock progress

  return (
    <div
      className={`flex items-center gap-4 bg-[var(--bg-glass)] backdrop-blur-[20px] border border-[var(--border-2)] rounded-[14px] py-3.5 px-[18px] shadow-[0_14px_32px_-14px_color-mix(in_srgb,var(--primary)_20%,transparent)] saturate-[1.4] ${className}`}
    >
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-10 h-10 rounded-full bg-[var(--aurora-400)] text-[var(--on-primary)] flex items-center justify-center shrink-0 shadow-[0_6px_22px_-6px_color-mix(in_srgb,var(--primary)_65%,transparent),inset_0_1px_0_rgba(255,255,255,0.2)] hover:scale-[1.05] active:scale-[0.95] transition-transform duration-base ease-knik-out cursor-pointer"
      >
        <span className="material-symbols-outlined text-[22px]">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="flex flex-col flex-1 min-w-0 gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[12.5px] text-[var(--aurora-300)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--primary)_25%,transparent)] px-2 py-0.5 rounded-[5px]">
            {voiceName}
          </span>
          <span className="text-[12.5px] text-[var(--fg-2)] truncate">{text}</span>
          <span className="ml-auto font-mono text-[11px] text-[var(--fg-4)]">00:08 / 00:14</span>
        </div>

        <div className="flex items-center gap-[2px] h-7">
          {WAVE_BARS.map((height, i) => {
            const isPlayed = i < playedCount
            const isCursor = i === playedCount

            return (
              <span
                key={i}
                style={{ height: `${height}px` }}
                className={`
                  rounded-[1.5px]
                  ${isCursor ? 'w-[3px] bg-[var(--fg-1)] shadow-[0_0_6px_var(--aurora-300)]' : 'w-[2.5px]'}
                  ${isPlayed && !isCursor ? 'bg-gradient-to-b from-[var(--aurora-300)] to-[var(--teal-400)]' : ''}
                  ${!isPlayed && !isCursor ? 'bg-[var(--bg-surface-3)]' : ''}
                `}
              />
            )
          })}
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <button className="w-8 h-8 rounded-lg bg-transparent border-none text-[var(--fg-3)] inline-flex items-center justify-center cursor-pointer hover:bg-[var(--bg-surface-3)] hover:text-[var(--fg-1)] transition-colors duration-fast">
          <span className="material-symbols-outlined text-[18px]">replay</span>
        </button>
        <button className="w-8 h-8 rounded-lg bg-transparent border-none text-[var(--fg-3)] inline-flex items-center justify-center cursor-pointer hover:bg-[var(--bg-surface-3)] hover:text-[var(--fg-1)] transition-colors duration-fast">
          <span className="material-symbols-outlined text-[18px]">stop</span>
        </button>
        <button className="w-8 h-8 rounded-lg bg-transparent border-none text-[var(--fg-3)] inline-flex items-center justify-center cursor-pointer hover:bg-[var(--bg-surface-3)] hover:text-[var(--fg-1)] transition-colors duration-fast">
          <span className="material-symbols-outlined text-[18px]">download</span>
        </button>
      </div>
    </div>
  )
}
