import { Select } from '$components'
import Button from '$components/buttons/Button'
import type { ExecutionsFilterBarProps } from '$types/sections/execution-history'

const FILTER_SELECT_CLASS = 'min-h-[34px] rounded-[9px] text-label'

export default function ExecutionsFilterBar({
  workflows,
  selectedWorkflow,
  selectedStatus,
  onWorkflowChange,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  shownCount,
  totalCount,
}: ExecutionsFilterBarProps) {
  return (
    <div className="py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="workflow-filter" className="text-label text-fg-3">
            Workflow:
          </label>
          <Select
            id="workflow-filter"
            presentation="native"
            value={selectedWorkflow}
            onChange={onWorkflowChange}
            size="sm"
            className={FILTER_SELECT_CLASS}
            options={[
              { value: '', label: 'All Workflows' },
              ...workflows.map(workflow => ({ value: workflow.id, label: workflow.name })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-label text-fg-3">
            Status:
          </label>
          <Select
            id="status-filter"
            presentation="native"
            value={selectedStatus}
            onChange={onStatusChange}
            size="sm"
            className={FILTER_SELECT_CLASS}
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
          <Button variant="ghost" size="sm" className="rounded-[9px]" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        <div className="ml-auto text-body-sm text-fg-3">
          Showing {shownCount} of {totalCount} executions
        </div>
      </div>
    </div>
  )
}
