import { LoadingSpinner } from '$components'
import type { FullScreenLoaderProps } from '$types'

/** Centered loading spinner — full-screen (`screen`) or block-level (`block`). */
export default function FullScreenLoader({ variant = 'screen' }: FullScreenLoaderProps) {
  const cls =
    variant === 'screen'
      ? 'flex items-center justify-center h-screen'
      : 'flex items-center justify-center py-20'
  return (
    <div className={cls}>
      <LoadingSpinner />
    </div>
  )
}
