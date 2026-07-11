import type { Schedule } from '$types/workflow'

/** Props for the cron schedule list panel. */
export interface ScheduleListPanelProps {
  schedules: Schedule[]
  workflowNames: Record<string, string>
  loading: boolean
  error: string | null
  onToggle: (schedule: Schedule, enabled: boolean) => void
  onDelete: (schedule: Schedule) => void
}
