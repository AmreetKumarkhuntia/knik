import type { CheckboxProps } from '$types'
/**
 * Custom checkbox with aurora check mark and focus ring.
 */
export default function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: CheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        className={`relative shrink-0 w-[18px] h-[18px] border-[1.5px] rounded-xs inline-flex items-center justify-center transition-all duration-base focus-within:ring-2 focus-within:ring-[var(--border-focus)] ${
          checked
            ? 'bg-[var(--primary)] border-[var(--primary)]'
            : 'bg-[var(--bg-surface-2)] border-[var(--border-3)]'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 [cursor:inherit] z-10"
        />
        {checked && (
          <div
            aria-hidden="true"
            className="w-[10px] h-[5px] border-l-[2px] border-b-[2px] border-[var(--on-primary)]"
            style={{ transform: 'rotate(-45deg) translate(1px, -1px)' }}
          />
        )}
      </div>
      {label && <span className="text-label text-[var(--fg-2)]">{label}</span>}
    </label>
  )
}
