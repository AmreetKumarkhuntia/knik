import type { ExecutionStatus } from '$types/workflow'
import { executionStatusConfig, badgeSizes } from '$lib/constants'

interface StatusBadgeProps {
  status: ExecutionStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = executionStatusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${badgeSizes[size]}`}
    >
      {status === 'running' && (
        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
      )}
      {config.label}
    </span>
  )
}
