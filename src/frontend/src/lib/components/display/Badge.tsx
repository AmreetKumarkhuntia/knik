import type { BadgeProps } from '$types'

export default function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`knik-badge knik-badge--md knik-badge--${variant} transition-colors duration-base ease-out ${className}`}
      {...props}
    >
      <span className="knik-badge__dot" aria-hidden="true" />
      {children}
    </span>
  )
}
