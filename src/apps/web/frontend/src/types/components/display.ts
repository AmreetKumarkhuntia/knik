import type * as React from 'react'
import type { ReactNode, CSSProperties } from 'react'
import type { ExecutionStatus } from '$types/workflow'

/** Props for a status badge. */
export interface StatusBadgeProps {
  status: ExecutionStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Column definition for a data table. */
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => ReactNode
}

/** Props for a generic data table. */
export interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  empty?: ReactNode
  className?: string
  maxHeight?: string
  stickyHeader?: boolean
  glassContainer?: boolean
}

/** Props for a section header with optional action. */
export interface SectionHeaderProps {
  title: string
  actionText?: string
  onActionClick?: () => void
  badge?: string
  className?: string
}

/** Props for a user profile display. Identity is always supplied by the caller. */
export interface UserProfileProps {
  avatar: string
  name: string
  avatarColor?: string
  account?: string
  displayOnly?: boolean
  showBadge?: boolean
  badgeType?: 'pro' | 'basic' | 'admin'
}

/** Props for an empty state placeholder. */
export interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Props for a page header with breadcrumbs. */
export interface PageHeaderProps {
  breadcrumbs: string[]
  rightContent?: ReactNode
  showBackButton?: boolean
  onBackClick?: () => void
  sticky?: boolean
}

export interface AvatarProps {
  initials: string
  size?: number
  color?: 'surface' | 'accent'
  className?: string
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: React.ReactNode
  variant?: 'default' | 'tag' | 'voice' | 'lang' | 'team' | 'input' | 'kbd'
  icon?: React.ReactNode
  onRemove?: () => void
  className?: string
}

export interface KbdProps {
  children: ReactNode
  className?: string
}

export interface KnikGlyphProps {
  size?: number
  glow?: boolean
  className?: string
}

export interface MSProps {
  name: string
  size?: number
  fill?: 0 | 1
  weight?: number
  grade?: number
  className?: string
  style?: CSSProperties
}
