import { useId } from 'react'
import type { RadioProps } from '$types/components/forms'
export default function Radio({
  options,
  value,
  onChange,
  name,
  disabled,
  className = '',
  presentation = 'standard',
  label,
}: RadioProps) {
  const id = useId()
  return (
    <fieldset disabled={disabled} className={`min-w-0 ${className}`}>
      {label && <legend className="mb-2 text-sm text-fg-2">{label}</legend>}
      <div className={presentation === 'standard' ? 'flex flex-col gap-3' : 'flex flex-wrap gap-2'}>
        {options.map((option, index) => (
          <label
            key={option.value}
            htmlFor={`${id}-${index}`}
            className={`relative cursor-pointer focus-within:ring-2 focus-within:ring-[var(--acc)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${presentation === 'standard' ? 'flex items-center gap-3' : `flex items-center gap-2 rounded-[var(--r-btn)] border p-3 ${value === option.value ? 'border-[var(--acc)] bg-[var(--acc-soft)]' : 'border-border-2 bg-surface-2'}`}`}
          >
            <input
              id={`${id}-${index}`}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={presentation === 'standard' ? 'accent-[var(--acc)]' : 'sr-only'}
            />
            <span className="text-[13px] text-fg-2">{option.label}</span>
            {option.monoLabel && (
              <span className="font-mono text-[10px] text-fg-4">{option.monoLabel}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
