import { spinnerSizes } from '$lib/constants'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-white/30 border-t-white
          ${spinnerSizes[size]}
        `}
      />
    </div>
  )
}
