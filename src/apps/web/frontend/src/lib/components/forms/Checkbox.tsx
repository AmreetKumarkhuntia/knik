import type { CheckboxProps } from '$types'
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
  presentation = 'standard',
  id,
  name,
  'aria-describedby': describedBy,
}: CheckboxProps) {
  const isChecked = checked || indeterminate

  return (
    <label
      className={`flex items-center gap-3 cursor-pointer ${presentation === 'chip' ? 'px-3 py-2 rounded-lg border border-border-2 bg-surface-2' : ''} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        className={`relative shrink-0 w-[18px] h-[18px] border-[1.5px] rounded-xs inline-flex items-center justify-center transition-all duration-base focus-within:ring-2 focus-within:ring-[var(--border-focus)] ${
          isChecked
            ? 'bg-[var(--primary)] border-[var(--primary)]'
            : 'bg-[var(--bg-surface-2)] border-[var(--border-3)]'
        }`}
      >
        <input
          id={id}
          name={name}
          aria-describedby={describedBy}
          type="checkbox"
          checked={checked}
          ref={input => {
            if (input) input.indeterminate = indeterminate
          }}
          onChange={e => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-inherit z-10"
        />
        {checked && !indeterminate && (
          <div
            aria-hidden="true"
            className="w-[10px] h-[5px] border-l-[2px] border-b-[2px] border-[var(--on-primary)]"
            style={{ transform: 'rotate(-45deg) translate(1px, -1px)' }}
          />
        )}
        {indeterminate && (
          <div aria-hidden="true" className="w-[8px] h-[2px] bg-[var(--on-primary)] rounded-full" />
        )}
      </div>
      {label && <span className="text-[13px] text-[var(--fg-2)]">{label}</span>}
    </label>
  )
}
