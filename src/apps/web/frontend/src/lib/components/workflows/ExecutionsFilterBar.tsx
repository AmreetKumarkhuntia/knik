import { Select } from '$components'
import Button from '$components/buttons/Button'
import type { ExecutionsFilterBarProps } from '$types/sections/execution-history'

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
    <div className="py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="workflow-filter" className="text-sm font-medium text-subtle">
            Workflow:
          </label>
          <Select
            id="workflow-filter"
            presentation="native"
            value={selectedWorkflow}
            onChange={onWorkflowChange}
            options={[
              { value: '', label: 'All Workflows' },
              ...workflows.map(workflow => ({ value: workflow.id, label: workflow.name })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-subtle">
            Status:
          </label>
          <Select
            id="status-filter"
            presentation="native"
            value={selectedStatus}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'running', label: 'Running' },
              { value: 'success', label: 'Success' },
              { value: 'failed', label: 'Failed' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        <div className="ml-auto text-sm text-secondary">
          {loading ? 'Loading…' : `Showing ${shownCount} of ${totalCount} executions`}
        </div>
      </div>
    </div>
  )
}
