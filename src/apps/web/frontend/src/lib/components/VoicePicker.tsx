import React from 'react'
import { DEFAULT_VOICES } from '$constants/demoData'

export interface Voice {
  id: string
  name: string
  lang: string
  tags: string[]
  gradient: string
}

export interface VoicePickerProps {
  voices?: Voice[]
  selected?: string
  onSelect: (id: string) => void
  className?: string
}

const GRADIENTS: Record<string, string> = {
  'g-rose': 'bg-gradient-to-br from-pink-500 to-pink-700',
  'g-amber': 'bg-gradient-to-br from-amber-500 to-amber-700',
  'g-aurora': 'bg-gradient-to-br from-[var(--aurora-400)] to-teal-500',
  'g-violet': 'bg-gradient-to-br from-violet-400 to-violet-600',
  'g-emerald': 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'g-sky': 'bg-gradient-to-br from-sky-400 to-sky-600',
  'g-slate': 'bg-gradient-to-br from-slate-400 to-slate-600',
  'g-zinc': 'bg-gradient-to-br from-zinc-300 to-zinc-500',
  'g-stone': 'bg-gradient-to-br from-stone-300 to-stone-500',
}

export default function VoicePicker({
  voices = DEFAULT_VOICES,
  selected = 'af_heart',
  onSelect,
  className = '',
}: VoicePickerProps) {
  const total = voices.length
  const female = voices.filter(v => v.name.startsWith('af_')).length
  const male = voices.filter(v => v.name.startsWith('am_')).length

  return (
    <div className={className}>
      <div className="font-mono text-[10px] text-[var(--fg-4)] tracking-[0.08em] uppercase mb-2.5">
        Kokoro voices{' '}
        <span className="float-right text-[var(--aurora-300)] normal-case tracking-normal">
          {total} total · {female} female · {male} male
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {voices.map(voice => {
          const isSelected = selected === voice.id
          const avText = voice.name.substring(0, 2)

          return (
            <div
              key={voice.id}
              onClick={() => onSelect(voice.id)}
              className={`
                relative flex items-center gap-2.5 p-2.5 px-3 rounded-[10px] cursor-pointer transition-all duration-fast
                ${
                  isSelected
                    ? 'bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] border-[color-mix(in_srgb,var(--primary)_55%,transparent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,transparent)]'
                    : 'bg-[var(--bg-surface-2)] border-[var(--border-2)] hover:border-[var(--border-3)]'
                }
                border
              `}
            >
              <span
                className={`w-[30px] h-[30px] rounded-full inline-flex items-center justify-center text-white font-mono text-[11px] font-semibold shrink-0 ${GRADIENTS[voice.gradient] || GRADIENTS['g-aurora']}`}
              >
                {avText}
              </span>

              <div className="flex-1 min-w-0">
                <div
                  className={`font-mono text-[12px] font-semibold tracking-[-0.005em] truncate ${isSelected ? 'text-[var(--aurora-200)]' : 'text-[var(--fg-1)]'}`}
                >
                  {voice.name}
                </div>
                <div className="text-[10.5px] text-[var(--fg-4)] mt-[1px] truncate">
                  {voice.lang} · {voice.tags.join(' ')}
                </div>
              </div>

              {isSelected && (
                <span className="material-symbols-outlined text-[18px] text-[var(--aurora-300)] ml-auto shrink-0">
                  check_circle
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
