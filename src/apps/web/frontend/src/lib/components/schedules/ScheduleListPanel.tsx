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
            className="knik-focus rounded-xs text-h4 text-fg-1 transition-colors duration-base ease-out hover:text-[var(--acc-text)]"
          >
            {workflowName(schedule)}
          </Link>
        ) : (
          <span className="text-body text-fg-3">{workflowName(schedule)}</span>
        ),
    },
    {
      key: 'schedule_description',
      label: 'Schedule',
      render: (_, schedule) => (
        <span className="flex items-center gap-2 text-body text-fg-2">
          <MS name="schedule" size={16} className="shrink-0 text-fg-4" />
          <span className="min-w-0">{schedule.schedule_description ?? 'Recurring'}</span>
        </span>
      ),
    },
    {
      key: 'next_run_at',
      label: 'Next run',
      render: (_, schedule) => (
        <span className="whitespace-nowrap text-body text-fg-3">
          {schedule.next_run_at ? formatDate(schedule.next_run_at) : '—'}
        </span>
      ),
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: (_, schedule) => (
        <span className="font-mono text-mono-sm text-fg-2">{schedule.timezone || 'UTC'}</span>
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
            className="knik-btn--icon knik-btn--destructive"
            icon={<MS name="delete" size={17} />}
            aria-label={`Delete schedule for ${workflowName(schedule)}`}
            onClick={() => onDelete(schedule)}
          />
        </div>
      ),
    },
  ]
  return (
    <Table
      columns={columns}
      data={schedules}
      getRowKey={schedule => schedule.id}
      empty={
        <EmptyState
          icon="schedule"
          title="No schedules yet"
          description="Add a schedule to preview it in this session. No jobs are executed."
        />
      }
    />
  )
}
