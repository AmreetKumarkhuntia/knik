import { VOICE_GRADIENTS as GRADIENTS } from '$lib/constants'
import type { VoicePickerProps } from '$types'

export default function VoicePicker({
  voices,
  selected,
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
