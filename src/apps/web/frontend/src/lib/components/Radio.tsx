export interface RadioOption {
  label: string
  value: string
  monoLabel?: string
}

export interface RadioProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name: string
  disabled?: boolean
  className?: string
}

/**
 * Custom radio group with dot fill on select.
 */
export default function Radio({
  options,
  value,
  onChange,
  name,
  disabled = false,
  className = '',
}: RadioProps) {
  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {options.map(opt => {
        const isSelected = value === opt.value
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-3 cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div
              className={`w-[18px] h-[18px] border-[1.5px] rounded-full inline-flex items-center justify-center transition-all duration-base focus-within:ring-[3px] focus-within:ring-[color-mix(in_srgb,var(--primary)_18%,transparent)] ${
                isSelected
                  ? 'bg-[var(--aurora-400)] border-[var(--aurora-400)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_18%,transparent)]'
                  : 'bg-[var(--bg-surface-2)] border-[var(--border-3)]'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => !disabled && onChange(opt.value)}
                disabled={disabled}
                className="sr-only"
              />
              {isSelected && (
                <div className="w-[6px] h-[6px] rounded-full bg-[var(--on-primary)]" />
              )}
            </div>
            <span className="text-[13px] text-[var(--fg-2)]">{opt.label}</span>
            {opt.monoLabel && (
              <span className="font-mono text-[10px] text-[var(--fg-4)] tracking-[0.04em] uppercase ml-auto">
                {opt.monoLabel}
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}
