import type { ReactNode } from 'react'
import type { InputHTMLAttributes } from 'react'
import type { ExecutionStatus } from '$types/workflow'

// Existing types
export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
  size?: ModalSize
  animationEnabled?: boolean
}

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

// Component props
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

export interface BackdropProps {
  visible: boolean
  onClick: () => void
  blur?: 'sm' | 'md' | 'lg'
  opacity?: number
  className?: string
}

export interface CardProps {
  children: ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export interface FormFieldProps {
  label?: string
  type?: 'text' | 'select' | 'number'
  name?: string
  value?: string
  onChange?: (value: string) => void
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export interface IconButtonProps {
  icon: ReactNode
  onClick: () => void
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel: string
  disabled?: boolean
  className?: string
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string
  fullWidth?: boolean
  id?: string
}

export interface LinkButtonProps {
  icon?: string
  label: string
  onClick?: () => void
  active?: boolean
  className?: string
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export interface MarkdownMessageProps {
  content: string
  isStreaming?: boolean
}

export interface StatusBadgeProps {
  status: ExecutionStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => ReactNode
}

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

export interface Tab<T extends string> {
  id: T
  label: string
  icon?: string
}

export interface TabsProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
  variant?: 'underline' | 'pills'
  className?: string
}

export interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export interface HamburgerButtonProps {
  onClick: () => void
  className?: string
}

export interface Trend {
  direction: 'up' | 'down' | 'neutral'
  value: string
  icon?: string
}

export interface MetricCardProps {
  icon: string
  label: string
  value: number | string
  subtext?: string
  trend?: Trend
  color?: 'primary' | 'teal' | 'rose' | 'blue'
  loading?: boolean
}

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

// Extended component types
export interface EnhancedEmptyStateProps extends EmptyStateProps {
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  iconSize?: number
}

export interface NavLinkProps {
  icon: string
  label: string
  active?: boolean
  href?: string
  onClick?: () => void
}

export interface NotificationButtonProps {
  badgeCount?: number
  onClick?: () => void
}

export interface SearchBarProps {
  placeholder?: string
}

export interface SectionHeaderProps {
  title: string
  actionText?: string
  onActionClick?: () => void
  badge?: string
  className?: string
}

export interface UserProfileProps {
  avatar?: string
  avatarColor?: string
  name?: string
  account?: string
  displayOnly?: boolean
  showBadge?: boolean
  badgeType?: 'pro' | 'basic' | 'admin'
}
