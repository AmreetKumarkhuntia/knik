import type { ExecutionRecord } from '$types/workflow'
import { StatusBadge, EmptyState } from '$common'
import { formatDuration, formatDate } from '$utils'

interface HistoryTableProps {
  executions: ExecutionRecord[]
  loading: boolean
  onViewDetail: (execution: ExecutionRecord) => void
  onRetry?: (execution: ExecutionRecord) => void
}

export default function HistoryTable({
  executions,
  loading,
  onViewDetail,
  onRetry,
}: HistoryTableProps) {
  if (loading) {
    return (
      <div className="text-center py-10 text-white/50">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
        <p className="mt-2">Loading history...</p>
      </div>
    )
  }

  if (executions.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title="No execution history yet"
        description="Run a workflow to see its history here"
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="px-4 py-3 text-white/60 font-medium text-sm">ID</th>
            <th className="px-4 py-3 text-white/60 font-medium text-sm">Status</th>
            <th className="px-4 py-3 text-white/60 font-medium text-sm">Started</th>
            <th className="px-4 py-3 text-white/60 font-medium text-sm">Duration</th>
            <th className="px-4 py-3 text-white/60 font-medium text-sm">Error</th>
            <th className="px-4 py-3 text-white/60 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {executions.map(execution => (
            <tr
              key={execution.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-3 text-white/80 font-mono text-sm">#{execution.id}</td>
              <td className="px-4 py-3">
                <StatusBadge status={execution.status} size="sm" />
              </td>
              <td className="px-4 py-3 text-white/60 text-sm">
                {formatDate(execution.started_at)}
              </td>
              <td className="px-4 py-3 text-white/60 text-sm font-mono">
                {formatDuration(execution.duration_ms)}
              </td>
              <td className="px-4 py-3 text-red-400 text-sm max-w-xs truncate">
                {execution.error_message || '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDetail(execution)}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    View
                  </button>
                  {execution.status === 'failed' && onRetry && (
                    <button
                      onClick={() => onRetry(execution)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
