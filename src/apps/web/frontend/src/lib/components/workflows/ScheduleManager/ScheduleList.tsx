import type { Schedule } from '$types/workflow'
import { LoadingSpinner } from '../common'
import ScheduleCard from './ScheduleCard'

interface ScheduleListProps {
  schedules: Schedule[]
  loading: boolean
  workflowNames: Record<string, string>
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onRun: (workflowId: string) => void
}

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
      <div className="text-center py-20 text-white/50">
        <p className="text-4xl mb-4">📅</p>
        <p>No schedules configured yet</p>
        <p className="text-sm mt-2">Create a schedule to automate workflow execution</p>
      </div>
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
