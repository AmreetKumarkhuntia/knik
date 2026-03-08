import { forwardRef } from 'react'
import type { InputProps } from '$types/components'

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, fullWidth = true, className = '', ...props }, ref) => {
    const inputClassName =
      'bg-white/10 text-white placeholder-white/40 px-6 py-4 rounded-lg ' +
      'focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        <input
          ref={ref}
          className={`${inputClassName} ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
