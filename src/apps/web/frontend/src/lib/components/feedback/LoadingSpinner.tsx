import { spinnerSizes } from '$lib/constants'
import type { LoadingSpinnerProps } from '$types/components'

/** Animated loading spinner with optional label text. */
export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-[var(--primary)] ${className}`}
    >
      <div className={`knik-spinner ${spinnerSizes[size]}`} />
      {text && <p className="text-sm text-fg-4">{text}</p>}
    </div>
  )
}
