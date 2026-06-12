export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
  className?: string
}

/**
 * Custom checkbox with aurora check mark and focus ring.
 */
export default function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  className = '',
}: CheckboxProps) {
  const isChecked = checked || indeterminate

  return (
    <label
      className={`flex items-center gap-3 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        className={`w-[18px] h-[18px] border-[1.5px] rounded-xs inline-flex items-center justify-center transition-all duration-base focus-within:ring-[3px] focus-within:ring-[color-mix(in_srgb,var(--primary)_18%,transparent)] ${
          isChecked
            ? 'bg-[var(--aurora-400)] border-[var(--aurora-400)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_18%,transparent)]'
            : 'bg-[var(--bg-surface-2)] border-[var(--border-3)]'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          ref={input => {
            if (input) input.indeterminate = indeterminate
          }}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        {checked && !indeterminate && (
          <div
            className="w-[10px] h-[5px] border-l-[2px] border-b-[2px] border-[var(--on-primary)]"
            style={{ transform: 'rotate(-45deg) translate(1px, -1px)' }}
          />
        )}
        {indeterminate && <div className="w-[8px] h-[2px] bg-[var(--on-primary)] rounded-full" />}
      </div>
      {label && <span className="text-[13px] text-[var(--fg-2)]">{label}</span>}
    </label>
  )
}
