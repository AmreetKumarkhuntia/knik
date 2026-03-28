import ActionButton from '$components/ActionButton'
import ToggleSwitch from '$components/ToggleSwitch'
import type { ScheduleCardProps } from '$types/sections/schedule-manager'
import { PlayArrow, Edit, Delete } from '@mui/icons-material'

/** Converts a recurrence interval in seconds to a human-readable string. */
function formatRecurrence(seconds?: number): string {
  if (!seconds) return 'One-time'
  if (seconds < 3600) return `Every ${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `Every ${Math.round(seconds / 3600)} hr`
  if (seconds < 604800) return `Every ${Math.round(seconds / 86400)} day`
  return `Every ${Math.round(seconds / 604800)} week`
}

/** Card displaying schedule details with toggle, run, edit, and delete actions. */
export default function ScheduleCard({
  schedule,
  workflowName,
  onToggle,
  onEdit,
  onDelete,
  onRun,
}: ScheduleCardProps) {
  return (
    <div className="bg-surfaceGlass backdrop-blur-3xl border border-borderLight rounded-xl p-4 hover:border-primary transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium">{workflowName || schedule.target_workflow_id}</h3>
          {schedule.schedule_description && (
            <p className="text-textSecondary text-sm">{schedule.schedule_description}</p>
          )}
        </div>
        <ToggleSwitch
          checked={schedule.enabled}
          onChange={(checked: boolean) => onToggle(schedule.id, checked)}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-textSecondary mb-4">
        <span>{formatRecurrence(schedule.recurrence_seconds)}</span>
        <span>TZ: {schedule.timezone}</span>
        {schedule.next_run_at && (
          <span>Next: {new Date(schedule.next_run_at).toLocaleString()}</span>
        )}
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
          onClick={() => onRun(schedule.target_workflow_id)}
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
