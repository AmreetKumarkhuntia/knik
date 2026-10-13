import { forwardRef, useId } from 'react'
import type { InputProps } from '$types/components'
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, fullWidth = true, className = '', ...props },
  ref
) {
  const errorId = useId()
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <input
        ref={ref}
        className={`knik-input ${fullWidth ? 'w-full' : ''} px-3 py-1.5 ${className}`}
        {...props}
        aria-invalid={!!error || props['aria-invalid']}
        aria-describedby={
          [props['aria-describedby'], error ? errorId : ''].filter(Boolean).join(' ') || undefined
        }
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-caption text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
})
export default Input
