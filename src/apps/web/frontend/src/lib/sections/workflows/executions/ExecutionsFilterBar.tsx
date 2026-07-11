import type { ExecutionsFilterBarProps } from '$types/sections/execution-history'

/** Workflow + status filter bar with a live shown/total count. */
export default function ExecutionsFilterBar({
  workflows,
  selectedWorkflow,
  selectedStatus,
  onWorkflowChange,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  loading,
  shownCount,
  totalCount,
}: ExecutionsFilterBarProps) {
  return (
    <div className="glass border border-border rounded-xl p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="workflow-filter" className="text-sm font-medium text-subtle">
            Workflow:
          </label>
          <select
            id="workflow-filter"
            value={selectedWorkflow}
            onChange={e => onWorkflowChange(e.target.value)}
            className="px-3 py-1.5 text-sm bg-surfaceRaised border border-border rounded-lg text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Workflows</option>
            {workflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-subtle">
            Status:
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={e => onStatusChange(e.target.value)}
            className="px-3 py-1.5 text-sm bg-surfaceRaised border border-border rounded-lg text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 text-sm font-medium text-subtle hover:text-foreground border border-border rounded-lg hover:bg-surface transition-all"
          >
            Clear Filters
          </button>
        )}

        <div className="ml-auto text-sm text-secondary">
          {loading ? (
            <span>Loading...</span>
          ) : (
            <span>
              Showing <span className="font-semibold text-foreground">{shownCount}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> executions
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
