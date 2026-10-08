import { StatusBadge, EmptyState, Table } from '$components'
import Button from '$components/buttons/Button'
import { formatDuration, formatDate } from '$lib/utils/format'
import type { DashboardExecution, ExecutionStatus } from '$types/workflow'
import type { HistoryTableProps } from '$types/sections/execution-history'
import { History } from '@mui/icons-material'

/** Table of execution history records with status, duration, and actions. */
export default function HistoryTable({
  executions,
  loading,
  onViewDetail,
  maxHeight = '300px',
}: HistoryTableProps) {
  const columns = [
    {
      key: 'workflowName' as const,
      label: 'Workflow',
      render: (value: unknown) => (
        <span className="text-sm font-semibold text-foreground">{value as string}</span>
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
        <span className="text-sm text-secondary">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'durationMs' as const,
      label: 'Duration',
      render: (value: unknown) => (
        <span className="text-sm text-secondary font-mono">{formatDuration(value as number)}</span>
      ),
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      render: (_: unknown, row: DashboardExecution) => (
        <div className="flex gap-2">
          <Button label="View" variant="ghost" size="sm" onClick={() => onViewDetail(row)} />
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={executions}
      getRowKey={row => row.id}
      loading={loading}
      density="compact"
      empty={
        <EmptyState
          icon={<History style={{ fontSize: 40 }} />}
          title="No execution history yet"
          description="Execution records appear when a demo source or run scenario is supplied."
        />
      }
      maxHeight={maxHeight}
      stickyHeader={true}
    />
  )
}
