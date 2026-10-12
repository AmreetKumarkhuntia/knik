import { executionStatusConfig } from '$lib/constants'
import type { StatusBadgeProps } from '$types/components'

/** Colored badge indicating execution status. */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = executionStatusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium knik-badge--sm ${config.bg} ${config.text}`}
    >
      {status === 'running' && (
        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
      )}
      {config.label}
    </span>
  )
}
