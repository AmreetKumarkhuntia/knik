import { forwardRef } from 'react'
import type { InputProps } from '$types/components'

/** Styled text input with error state and forwarded ref. */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, fullWidth = true, className = '', ...props }, ref) => {
    const inputClassName =
      'bg-surfaceRaised text-foreground placeholder:text-foreground/40 px-6 py-4 rounded-lg ' +
      'focus:outline-none focus:ring-2 focus:ring-primary/30 border border-border ' +
      'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <input
          ref={ref}
          className={`${inputClassName} ${error ? 'border-error/50' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
