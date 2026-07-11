import type * as React from 'react'

/** Supported toast notification types. */
export type ToastType = 'success' | 'error' | 'info'

/** Props for a toast notification. */
export interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

/** Props for a loading spinner. */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'running'
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  children: React.ReactNode
  className?: string
}

/** Internal state for a toast notification. */
export interface ToastState {
  id: number
  message: string
  type: ToastType
}
