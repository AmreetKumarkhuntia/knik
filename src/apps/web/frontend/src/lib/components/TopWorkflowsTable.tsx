import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import type { TopWorkflowsTableProps } from '$types/components'

export default function TopWorkflowsTable({
  workflows,
  loading = false,
  onRowClick,
}: TopWorkflowsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: 'bg-teal-500/10 text-teal-400',
      inactive: 'bg-slate-500/10 text-slate-400',
      error: 'bg-rose-500/10 text-rose-400',
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-teal-400'
    if (rate >= 80) return 'text-yellow-400'
    return 'text-rose-400'
  }

  if (loading) {
    return (
      <div className="glass border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <div className="glass border border-white/10 rounded-xl overflow-hidden">
        <EmptyState
          icon="account_tree"
          title="No workflows yet"
          description="Create your first workflow to start tracking performance"
        />
      </div>
    )
  }

  return (
    <div className="glass border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Workflow Name
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Executions
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                Success
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {workflows.map(workflow => (
              <tr
                key={workflow.id}
                onClick={() => onRowClick?.(workflow)}
                className="hover:bg-white/5 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-white/10 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-lg">{workflow.icon}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">{workflow.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(workflow.status)}`}
                  >
                    {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {workflow.executions.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <span className={getSuccessRateColor(workflow.successRate)}>
                    {workflow.successRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
