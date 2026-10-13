import { Link } from 'react-router-dom'
import { Badge, EmptyState, MS, Table } from '$components'
import Button from '$components/buttons/Button'
import { formatDate } from '$utils/format'
import { ROUTE_PATHS } from '$lib/constants/navigation'
import type { HubWorkflowsTableProps } from '$types/sections/workflow-hub'
import type { TableColumn } from '$types/components'
import type { HubWorkflowRow } from '$types/workflow'

export default function HubWorkflowsTable({
  rows,
  isEmpty,
  onRun,
  canRun,
}: HubWorkflowsTableProps) {
  const columns: TableColumn<HubWorkflowRow>[] = [
    {
      key: 'name',
      label: 'Workflow',
      render: (_, row) => (
        <div className="flex items-center gap-3 min-w-0">
          <span className="knik-tile">
            <MS name="account_tree" size={18} className="text-[var(--acc-text)]" />
          </span>
          <div className="min-w-0">
            <Link
              className="knik-focus rounded-xs text-h4 text-fg-1 hover:text-[var(--acc-text)] transition-colors duration-base"
              to={ROUTE_PATHS.workflowEdit(row.id)}
            >
              {row.name}
            </Link>
            <p className="mt-0.5 text-body-sm text-fg-3 truncate max-w-80">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'lastExecutedAt',
      label: 'Last run',
      render: (_, row) => (
        <span className="font-mono text-mono-sm text-fg-3">
          {row.lastExecutedAt ? formatDate(row.lastExecutedAt) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'totalExecutions',
      label: 'Runs',
      render: (_, row) => (
        <span className="tabular-nums text-fg-2">{row.totalExecutions.toLocaleString()}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link
            to={ROUTE_PATHS.workflowEdit(row.id)}
            aria-label={`Edit ${row.name}`}
            className="knik-btn knik-btn--ghost knik-btn--sm knik-btn--icon knik-focus rounded-[9px] hover:!bg-panel-3"
          >
            <MS name="edit" size={17} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Run ${row.name}`}
            title={canRun(row.id) ? 'Run supplied demo scenario' : 'No demo run scenario supplied'}
            disabled={!canRun(row.id)}
            onClick={() => onRun(row.id)}
            className="knik-btn--icon rounded-[9px] enabled:hover:!bg-[var(--acc-soft)] enabled:hover:!text-[var(--acc-text)]"
          >
            <MS name="play_arrow" size={18} fill={1} />
          </Button>
        </div>
      ),
    },
  ]
  return (
    <div className="my-4 mb-8">
      <Table
        columns={columns}
        data={rows}
        getRowKey={row => row.id}
        empty={
          <EmptyState
            icon="account_tree"
            title={isEmpty ? 'No workflows yet' : 'No matching workflows'}
            description={
              isEmpty
                ? 'Create a workflow or connect the supplied demo source.'
                : 'Try a different search or filter.'
            }
          />
        }
      />
    </div>
  )
}
