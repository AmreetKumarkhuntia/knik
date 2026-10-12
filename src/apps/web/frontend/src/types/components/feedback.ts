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
  className?: string
}
