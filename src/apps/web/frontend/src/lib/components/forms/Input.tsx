import { forwardRef, useId } from 'react'
import type { InputProps } from '$types/components'
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, fullWidth = true, density = 'comfortable', className = '', ...props },
  ref
) {
  const errorId = useId()
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <input
        ref={ref}
        className={`knik-input ${fullWidth ? 'w-full' : ''} ${density === 'compact' ? 'px-3 py-2' : 'px-6 py-4'} ${className}`}
        {...props}
        aria-invalid={!!error || props['aria-invalid']}
        aria-describedby={
          [props['aria-describedby'], error ? errorId : ''].filter(Boolean).join(' ') || undefined
        }
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  )
})
export default Input
