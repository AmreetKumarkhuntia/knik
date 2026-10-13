import type { ReactNode } from 'react'

/** Props for the error boundary wrapper. */
export interface ErrorBoundaryProps {
  children: ReactNode
}

/** State tracked by the error boundary component. */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}
