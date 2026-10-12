import type { LoadingSpinnerProps } from '$types/components'

/** Animated loading spinner. */
export default function LoadingSpinner({ className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-[var(--primary)] ${className}`}
    >
      <div className="knik-spinner knik-spinner--md" />
    </div>
  )
}
