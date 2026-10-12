import type { BadgeProps } from '$types'

export default function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`knik-badge knik-badge--md knik-badge--${variant} uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
