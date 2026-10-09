import { useId } from 'react'
import type { SliderProps } from '$types'
/**
 * Native range control with a visible keyboard focus indicator.
 */
export default function Slider({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  className = '',
  id,
  name,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  formatValue,
}: SliderProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={`flex items-center gap-3.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs text-[var(--fg-4)] shrink-0">
          {label}
        </label>
      )}
      <input
        type="range"
        id={inputId}
        name={name}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="flex-1 min-w-0 h-9 cursor-pointer accent-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2 disabled:opacity-50"
      />
      <span className="tabular-nums text-sm text-fg-2 w-12 text-right shrink-0">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  )
}
