import type { ToggleSwitchProps } from '$types/components'

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
      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-text peer-checked:after:bg-text peer-checked:after:rounded-full peer-checked:after:h-5 peer-checked:after:w-5 peer-checked:after:transition-all peer-checked:bg-success disabled:opacity-50 disabled:cursor-not-allowed" />
      {label && <span className="ml-3 text-sm text-textSecondary">{label}</span>}
    </label>
  )
}
