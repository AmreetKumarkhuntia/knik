import type { ToggleSwitchProps } from '$types/components'

/** Toggle switch control with optional label. */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
}: ToggleSwitchProps) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className="relative w-10 h-[22px] rounded-full bg-[var(--bg-surface-3)] transition-colors duration-fast
          peer-checked:bg-[var(--aurora-400)]
          after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-[18px] after:w-[18px]
          after:rounded-full after:bg-white after:transition-all after:duration-fast
          peer-checked:after:translate-x-[18px]
          peer-focus-visible:ring-[3px] peer-focus-visible:ring-[rgba(0,217,244,0.18)]
          peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
      />
      {label && <span className="ml-3 text-sm text-fg-3">{label}</span>}
    </label>
  )
}
