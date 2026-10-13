import type { ToggleSwitchProps } from '$types/components'

/** Toggle switch control with optional label. */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: ToggleSwitchProps) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        role="switch"
        id={id}
        name={name}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className="relative shrink-0 w-[38px] h-[22px] rounded-full bg-[var(--border-3)] transition-colors duration-base ease-out
          peer-checked:bg-[var(--primary)]
          after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:h-4 after:w-4
          after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,.4)]
          after:transition-transform after:duration-slow after:ease-spring
          peer-checked:after:translate-x-4
          peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--border-focus)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-base)]
          peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
      />
      {label && <span className="ml-3 text-label text-fg-3">{label}</span>}
    </label>
  )
}
