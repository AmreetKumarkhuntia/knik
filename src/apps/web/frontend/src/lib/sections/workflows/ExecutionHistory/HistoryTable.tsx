import StatusBadge from '$components/StatusBadge'
import EmptyState from '$components/EmptyState'
import ActionButton from '$components/ActionButton'
import Table from '$components/Table'
import { formatDuration, formatDate } from '$lib/utils/format'
import type { DashboardExecution, ExecutionStatus } from '$types/workflow'
import type { HistoryTableProps } from '$types/sections/execution-history'
import { History } from '@mui/icons-material'

export default function HistoryTable({
  executions,
  loading,
  onViewDetail,
  onRetry,
  maxHeight = '300px',
}: HistoryTableProps) {
  const columns = [
    {
      key: 'workflowName' as const,
      label: 'Workflow',
      render: (value: unknown) => (
        <span className="text-sm font-semibold text-slate-100">{value as string}</span>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: unknown) => <StatusBadge status={value as ExecutionStatus} size="sm" />,
    },
    {
      key: 'startedAt' as const,
      label: 'Started',
      render: (value: unknown) => (
        <span className="text-sm text-slate-400">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'durationMs' as const,
      label: 'Duration',
      render: (value: unknown) => (
        <span className="text-sm text-slate-400 font-mono">{formatDuration(value as number)}</span>
      ),
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      render: (_: unknown, row: DashboardExecution) => (
        <div className="flex gap-2">
          <ActionButton label="View" variant="ghost" size="sm" onClick={() => onViewDetail(row)} />
          {row.status === 'failed' && onRetry && (
            <ActionButton
              label="Retry"
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300"
              onClick={() => onRetry(row)}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={executions}
      loading={loading}
      empty={
        <EmptyState
          icon={<History style={{ fontSize: 40 }} />}
          title="No execution history yet"
          description="Run a workflow to see its history here"
        />
      }
      maxHeight={maxHeight}
      stickyHeader={true}
      glassContainer={true}
    />
  )
}
