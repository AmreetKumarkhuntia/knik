import { Link } from 'react-router-dom'
import { Badge, Card, EmptyState, MS, Table } from '$components'
import Button from '$components/buttons/Button'
import { formatDate } from '$utils/format'
import type { HubWorkflowsTableProps } from '$types/sections/workflow-hub'
import type { TableColumn } from '$types/components'
import type { HubWorkflowRow } from '$types/workflow'

export default function HubWorkflowsTable({
  rows,
  loading,
  error,
  isEmpty,
  onRun,
  canRun,
  density,
}: HubWorkflowsTableProps) {
  const columns: TableColumn<HubWorkflowRow>[] = [
    {
      key: 'name',
      label: 'Workflow',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <MS name="account_tree" size={18} />
          <div className="min-w-0">
            <Link
              className="text-sm font-semibold text-foreground hover:underline"
              to={`/workflows/${encodeURIComponent(row.id)}/edit`}
            >
              {row.name}
            </Link>
            <p className="text-xs text-secondary truncate max-w-80">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'lastExecutedAt',
      label: 'Last run',
      render: (_, row) => (
        <span className="font-mono text-xs text-secondary">
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
      render: (_, row) => row.totalExecutions.toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/workflows/${encodeURIComponent(row.id)}/edit`}
            aria-label={`Edit ${row.name}`}
            className="text-secondary"
          >
            <MS name="edit" size={16} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Run ${row.name}`}
            title={canRun(row.id) ? 'Run supplied demo scenario' : 'No demo run scenario supplied'}
            disabled={!canRun(row.id)}
            onClick={() => onRun(row.id)}
          >
            <MS name="play_arrow" size={16} />
          </Button>
        </div>
      ),
    },
  ]
  return (
    <Card padding="none" className="my-4 mb-8">
      <Table
        columns={columns}
        data={rows}
        getRowKey={row => row.id}
        density={density}
        loading={loading}
        error={error ?? undefined}
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
    </Card>
  )
}
