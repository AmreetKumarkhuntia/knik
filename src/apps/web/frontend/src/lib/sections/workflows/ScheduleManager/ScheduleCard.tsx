import ActionButton from '$components/ActionButton'
import ToggleSwitch from '$components/ToggleSwitch'
import type { ScheduleCardProps } from '$types/sections/schedule-manager'
import { PlayArrow, Edit, Delete } from '@mui/icons-material'

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
    <div className="bg-surfaceGlass backdrop-blur-3xl border border-borderLight rounded-xl p-4 hover:border-primary transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium">{workflowName || schedule.workflow_id}</h3>
          <p className="text-textSecondary text-sm">
            Trigger: {triggerWorkflowName || schedule.trigger_workflow_id}
          </p>
        </div>
        <ToggleSwitch
          checked={schedule.enabled}
          onChange={(checked: boolean) => onToggle(schedule.id, checked)}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-textSecondary mb-4">
        <span>TZ: {schedule.timezone}</span>
        {schedule.last_executed_at && (
          <span>Last: {new Date(schedule.last_executed_at).toLocaleString()}</span>
        )}
      </div>

      <div className="flex gap-2">
        <ActionButton
          icon={<PlayArrow />}
          label="Run"
          size="sm"
          variant="primary"
          onClick={() => onRun(schedule.workflow_id)}
        />
        <ActionButton
          icon={<Edit />}
          label="Edit"
          size="sm"
          variant="secondary"
          onClick={() => onEdit(schedule)}
        />
        <ActionButton
          icon={<Delete />}
          label="Delete"
          size="sm"
          variant="danger"
          onClick={() => onDelete(schedule.id)}
        />
      </div>
    </div>
  )
}
