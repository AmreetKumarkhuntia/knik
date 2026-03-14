import { spinnerSizes } from '$lib/constants'
import type { LoadingSpinnerProps } from '$types/components'

export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-foreground/30 border-t-foreground
          ${spinnerSizes[size]}
        `}
      />
      {text && <p className="text-sm text-foreground/50">{text}</p>}
    </div>
  )
}
