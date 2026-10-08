import { useId } from 'react'
import type { FormFieldWidgetProps } from '$types/widgets'
export default function FormField({
  label,
  hint,
  error,
  htmlFor,
  hintId,
  required,
  layout = 'stacked',
  last,
  children,
}: FormFieldWidgetProps) {
  const generated = useId()
  const id = htmlFor ?? generated
  const descriptionId = hintId ?? `${id}-hint`
  const errorId = `${id}-error`
  return (
    <div
      className={
        layout === 'row'
          ? 'flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4'
          : 'flex flex-col gap-2'
      }
      style={
        layout === 'row' ? { borderBottom: last ? 'none' : '1px solid var(--border-1)' } : undefined
      }
    >
      <div className={layout === 'row' ? 'min-w-[160px] flex-1' : ''}>
        {htmlFor || typeof children === 'function' ? (
          <label htmlFor={id} className="text-sm font-medium text-fg-1">
            {label}
            {required && ' *'}
          </label>
        ) : (
          <div className="text-sm font-medium text-fg-1">{label}</div>
        )}
        {hint && (
          <p id={descriptionId} className="text-sm text-fg-3 mt-1">
            {hint}
          </p>
        )}
      </div>
      {typeof children === 'function'
        ? children({
            id,
            required,
            'aria-invalid': !!error || undefined,
            'aria-describedby':
              [hint && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined,
          })
        : children}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
}
