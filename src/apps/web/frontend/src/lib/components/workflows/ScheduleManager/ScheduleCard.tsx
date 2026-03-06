import type { Schedule } from '$types/workflow'
import { ActionButton } from '../common'

interface ScheduleCardProps {
  schedule: Schedule
  workflowName?: string
  triggerWorkflowName?: string
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onRun: (workflowId: string) => void
}

export default function ScheduleCard({
  schedule,
  workflowName,
  triggerWorkflowName,
  onToggle,
  onEdit,
  onDelete,
  onRun,
}: ScheduleCardProps) {
  return (
    <div className="bg-black/10 backdrop-blur-3xl border border-white/20 rounded-xl p-4 hover:border-white/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{workflowName || schedule.workflow_id}</h3>
          <p className="text-white/50 text-sm">
            Trigger: {triggerWorkflowName || schedule.trigger_workflow_id}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={() => onToggle(schedule.id, !schedule.enabled)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
        </label>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/60 mb-4">
        <span>TZ: {schedule.timezone}</span>
        {schedule.last_executed_at && (
          <span>Last: {new Date(schedule.last_executed_at).toLocaleString()}</span>
        )}
      </div>

      <div className="flex gap-2">
        <ActionButton
          icon="▶"
          label="Run"
          size="sm"
          variant="primary"
          onClick={() => onRun(schedule.workflow_id)}
        />
        <ActionButton
          icon="✎"
          label="Edit"
          size="sm"
          variant="secondary"
          onClick={() => onEdit(schedule)}
        />
        <ActionButton
          icon="🗑"
          label="Delete"
          size="sm"
          variant="danger"
          onClick={() => onDelete(schedule.id)}
        />
      </div>
    </div>
  )
}
