import StatusBadge from '$components/StatusBadge'
import EmptyState from '$components/EmptyState'
import { formatDuration, formatDate } from '$lib/utils/format'
import type { HistoryTableProps } from '$types/sections/execution-history'

export default function HistoryTable({
  executions,
  loading,
  onViewDetail,
  onRetry,
}: HistoryTableProps) {
  if (loading) {
    return (
      <div className="text-center py-10 text-textSecondary">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-border-t-text rounded-full" />
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
          <tr className="border-b border-border text-left">
            <th className="px-4 py-3 text-textSecondary font-medium text-sm">ID</th>
            <th className="px-4 py-3 text-textSecondary font-medium text-sm">Status</th>
            <th className="px-4 py-3 text-textSecondary font-medium text-sm">Started</th>
            <th className="px-4 py-3 text-textSecondary font-medium text-sm">Duration</th>
            <th className="px-4 py-3 text-textSecondary font-medium text-sm">Error</th>
            <th className="px-4 py-3 text-textSecondary font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {executions.map(execution => (
            <tr
              key={execution.id}
              className="border-b border-borderLight hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-3 text-textSecondary font-mono text-sm">#{execution.id}</td>
              <td className="px-4 py-3">
                <StatusBadge status={execution.status} size="sm" />
              </td>
              <td className="px-4 py-3 text-textSecondary text-sm">
                {formatDate(execution.started_at)}
              </td>
              <td className="px-4 py-3 text-textSecondary text-sm font-mono">
                {formatDuration(execution.duration_ms)}
              </td>
              <td className="px-4 py-3 text-error text-sm max-w-xs truncate">
                {execution.error_message || '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDetail(execution)}
                    className="text-textSecondary hover:text-text text-sm transition-colors"
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
