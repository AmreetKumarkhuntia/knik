import type { ExecutionStatus } from '$types/workflow'

interface StatusBadgeProps {
  status: ExecutionStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<ExecutionStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
  running: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Running' },
  success: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Success' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
}

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeConfig[size]}`}
    >
      {status === 'running' && (
        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
      )}
      {config.label}
    </span>
  )
}
