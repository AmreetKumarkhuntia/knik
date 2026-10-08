import type * as React from 'react'
import type { ReactNode } from 'react'

/** Props for a hamburger menu button. */
export interface HamburgerButtonProps {
  onClick: () => void
  className?: string
}

/** Props for a notification bell button. */
export interface NotificationButtonProps {
  disabled?: boolean
  title?: string
  badgeCount?: number
  onClick?: () => void
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  endIcon?: ReactNode
  label?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}
