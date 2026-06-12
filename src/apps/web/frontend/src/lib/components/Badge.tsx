import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

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
