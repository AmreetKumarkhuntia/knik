import { forwardRef } from 'react'
import type { InputProps } from '$types/components'

/** Styled text input with error state and forwarded ref. */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, fullWidth = true, className = '', ...props }, ref) => {
    const inputClassName = 'knik-input w-full px-6 py-4'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <input
          ref={ref}
          className={`${inputClassName} ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
