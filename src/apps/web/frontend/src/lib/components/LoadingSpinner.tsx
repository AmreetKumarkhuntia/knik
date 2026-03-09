import { spinnerSizes } from '$lib/constants'
import type { LoadingSpinnerProps } from '$types/components'

export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-white/30 border-t-white
          ${spinnerSizes[size]}
        `}
      />
      {text && <p className="text-sm text-white/50">{text}</p>}
    </div>
  )
}
