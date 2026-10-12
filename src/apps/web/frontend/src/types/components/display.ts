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
  getRowKey: (row: T) => React.Key
  empty?: ReactNode
  maxHeight?: string
  stickyHeader?: boolean
}

/** Props for a section header with optional action. */
export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'page' | 'section'
  subtitle?: string
  actions?: ReactNode
  title: string
  className?: string
}

/** Props for an empty state placeholder. */
export interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
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
  variant?: 'default' | 'tag'
  onRemove?: () => void
  className?: string
}

export interface KbdProps {
  children: ReactNode
  className?: string
}

export interface KnikGlyphProps {
  size?: number
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
