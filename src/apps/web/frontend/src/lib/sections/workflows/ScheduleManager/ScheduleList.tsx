import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import ScheduleCard from './ScheduleCard'
import type { ScheduleListProps } from '$types/sections/schedule-manager'
import { Schedule as ScheduleIcon } from '@mui/icons-material'

export default function ScheduleList({
  schedules,
  loading,
  workflowNames,
  onToggle,
  onEdit,
  onDelete,
  onRun,
}: ScheduleListProps) {
  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />
  }

  if (schedules.length === 0) {
    return (
      <EmptyState
        icon={<ScheduleIcon style={{ fontSize: 40 }} />}
        title="No schedules configured yet"
        description="Create a schedule to automate workflow execution"
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {schedules.map(schedule => (
        <ScheduleCard
          key={schedule.id}
          schedule={schedule}
          workflowName={workflowNames[schedule.workflow_id]}
          triggerWorkflowName={workflowNames[schedule.trigger_workflow_id]}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onRun={onRun}
        />
      ))}
    </div>
  )
}
