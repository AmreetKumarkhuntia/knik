import { Link } from 'react-router-dom'
import { ToggleSwitch, EmptyState, MS, Badge, Table } from '$components'
import Button from '$components/buttons/Button'
import { formatDate } from '$utils/format'
import { ROUTE_PATHS } from '$lib/constants/navigation'
import type { TableColumn } from '$types/components'
import type { Schedule } from '$types/workflow'
import type { ScheduleListPanelProps } from '$types/sections/schedules'

export default function ScheduleListPanel({
  schedules,
  workflowNames,
  loading,
  error,
  onToggle,
  onDelete,
}: ScheduleListPanelProps) {
  const workflowName = (schedule: Schedule) =>
    workflowNames[schedule.target_workflow_id] ?? 'Unavailable workflow'
  const columns: TableColumn<Schedule>[] = [
    {
      key: 'target_workflow_id',
      label: 'Workflow',
      render: (_, schedule) =>
        workflowNames[schedule.target_workflow_id] ? (
          <Link
            to={ROUTE_PATHS.workflowEdit(schedule.target_workflow_id)}
            className="font-medium text-foreground hover:underline"
          >
            {workflowName(schedule)}
          </Link>
        ) : (
          <span className="text-secondary">{workflowName(schedule)}</span>
        ),
    },
    {
      key: 'schedule_description',
      label: 'Schedule',
      render: (_, schedule) => schedule.schedule_description ?? 'Recurring',
    },
    {
      key: 'next_run_at',
      label: 'Next run',
      render: (_, schedule) => (
        <span className="whitespace-nowrap text-secondary">
          {schedule.next_run_at ? formatDate(schedule.next_run_at) : '—'}
        </span>
      ),
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: (_, schedule) => (
        <span className="font-mono text-xs">{schedule.timezone || 'UTC'}</span>
      ),
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (_, schedule) => (
        <Badge variant={schedule.enabled ? 'success' : 'default'}>
          {schedule.enabled ? 'Active' : 'Paused'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, schedule) => (
        <div className="flex items-center gap-3">
          <ToggleSwitch
            aria-label={`Enable schedule for ${workflowName(schedule)}`}
            checked={schedule.enabled}
            onChange={enabled => onToggle(schedule, enabled)}
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-[var(--danger)]"
            icon={<MS name="delete" size={16} />}
            aria-label={`Delete schedule for ${workflowName(schedule)}`}
            onClick={() => onDelete(schedule)}
          />
        </div>
      ),
    },
  ]
  return (
    <>
      <Table
        columns={columns}
        data={schedules}
        getRowKey={schedule => schedule.id}
        density="compact"
        loading={loading}
        error={error ?? undefined}
        empty={
          <EmptyState
            icon="schedule"
            title="No schedules yet"
            description="Add a schedule to preview it in this session. No jobs are executed."
          />
        }
      />
    </>
  )
}
