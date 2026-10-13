import { executionStatusConfig } from '$lib/constants'
import type { StatusBadgeProps } from '$types/components'

/** Dot pill naming an execution status; a running execution breathes. */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = executionStatusConfig[status]

  return (
    <span
      className={`knik-badge knik-badge--md ${status === 'running' ? 'knik-badge--live' : ''} ${config.bg} ${config.text}`}
    >
      <span className="knik-badge__dot" aria-hidden="true" />
      {config.label}
    </span>
  )
}
