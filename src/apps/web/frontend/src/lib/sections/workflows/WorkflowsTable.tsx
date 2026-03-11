import StatusBadge from '$components/StatusBadge'
import EmptyState from '$components/EmptyState'
import ActionButton from '$components/ActionButton'
import Table from '$components/Table'
import { formatDate } from '$lib/utils/format'
import { AccountTree } from '@mui/icons-material'
import type { DashboardWorkflow } from '$types/workflow'
import type { WorkflowsTableProps } from '$types/workflow-components'

export default function WorkflowsTable({ workflows, onEdit, onDelete }: WorkflowsTableProps) {
  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
      render: (_: unknown, row: DashboardWorkflow) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded bg-white/10 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-lg">account_tree</span>
          </div>
          <span className="text-sm font-semibold text-slate-100">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'lastExecutedAt' as const,
      label: 'Last Executed',
      render: (value: unknown) => (
        <span className="text-sm text-slate-400">
          {value ? formatDate(value as string) : 'Never'}
        </span>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (_: unknown, row: DashboardWorkflow) => (
        <StatusBadge status={row.status === 'active' ? 'success' : 'pending'} size="sm" />
      ),
    },
    {
      key: 'totalExecutions' as const,
      label: 'Executions',
      render: (value: unknown) => (
        <span className="text-sm text-slate-400 text-right block">
          {(value as number).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      render: (_: unknown, row: DashboardWorkflow) => (
        <div className="flex items-center justify-end gap-2">
          <ActionButton
            icon={<span className="material-symbols-outlined text-sm">edit</span>}
            variant="ghost"
            size="xs"
            onClick={() => onEdit(row.id)}
            title="Edit"
          />
          <ActionButton
            icon={<span className="material-symbols-outlined text-sm">delete</span>}
            variant="ghost"
            size="xs"
            onClick={() => onDelete(row.id, row.name)}
            title="Delete"
          />
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={workflows}
      empty={
        <EmptyState
          icon={<AccountTree style={{ fontSize: 40 }} />}
          title="No workflows found"
          description="Create your first workflow to get started"
        />
      }
      maxHeight="300px"
      stickyHeader={true}
      glassContainer={true}
    />
  )
}
