import React from 'react'
import type { BadgeProps } from '$types'

export default function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`knik-badge knik-badge--${size} knik-badge--${variant} uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
