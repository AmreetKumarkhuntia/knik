import { useId } from 'react'
import { RADIO_PRESENTATION } from '$lib/constants/atomsUi'
import type { RadioProps } from '$types/components/forms'
export default function Radio({
  options,
  value,
  onChange,
  name,
  disabled,
  className = '',
  presentation = 'standard',
  optionsClassName = '',
  label,
  hideLabel = false,
  'aria-describedby': describedBy,
}: RadioProps) {
  const id = useId()
  const look = RADIO_PRESENTATION[presentation]
  return (
    <fieldset disabled={disabled} aria-describedby={describedBy} className={`min-w-0 ${className}`}>
      {label && (
        <legend className={hideLabel ? 'sr-only' : 'mb-2 text-label text-fg-2'}>{label}</legend>
      )}
      <div className={`${look.options} ${optionsClassName}`}>
        {options.map((option, index) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              htmlFor={`${id}-${index}`}
              className={`relative cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--border-focus)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${look.option} ${selected ? look.selected : look.idle}`}
            >
              <input
                id={`${id}-${index}`}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className={
                  presentation === 'standard' ? 'accent-[var(--primary)] outline-none' : 'sr-only'
                }
              />
              {presentation === 'card' && (
                <span
                  aria-hidden="true"
                  className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-base ease-out ${selected ? 'border-[var(--primary)]' : 'border-[var(--border-3)]'}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full bg-[var(--primary)] transition-transform duration-slow ease-spring ${selected ? 'scale-100' : 'scale-0'}`}
                  />
                </span>
              )}
              <span className={look.label}>{option.label}</span>
              {option.monoLabel && (
                <span className={`shrink-0 font-mono text-fg-4 ${look.mono}`}>
                  {option.monoLabel}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
