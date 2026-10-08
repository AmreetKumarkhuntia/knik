import { forwardRef } from 'react'
import type { ButtonProps } from '$types/components/buttons'
import { buttonVariants, sizeVariants } from '$lib/constants/variants'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    label,
    icon,
    endIcon,
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled,
    type = 'button',
    className = '',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`knik-btn knik-focus ${buttonVariants[variant]} ${sizeVariants[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="knik-spinner knik-spinner--sm" aria-hidden="true" />
      ) : (
        icon && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {icon}
          </span>
        )
      )}
      {children ?? label}
      {endIcon && (
        <span aria-hidden="true" className="inline-flex">
          {endIcon}
        </span>
      )}
    </button>
  )
})
export default Button
