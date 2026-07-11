import type * as React from 'react'
import type { ReactNode } from 'react'

/** Props for a generic action button. */
export interface ActionButtonProps {
  icon?: ReactNode
  label?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  title?: string
}

export interface ActionIconProps {
  icon: ReactNode
  onClick?: (e: React.MouseEvent) => void
  title?: string
  size?: number
  active?: boolean
  danger?: boolean
  className?: string
}

/** Props for an icon-only button. */
export interface IconButtonProps {
  icon: ReactNode
  onClick: () => void
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel: string
  disabled?: boolean
  className?: string
}

/** Props for a link-styled button. */
export interface LinkButtonProps {
  icon?: string
  label: string
  onClick?: () => void
  active?: boolean
  className?: string
}

/** Props for a hamburger menu button. */
export interface HamburgerButtonProps {
  onClick: () => void
  className?: string
}

/** Props for a notification bell button. */
export interface NotificationButtonProps {
  badgeCount?: number
  onClick?: () => void
}
