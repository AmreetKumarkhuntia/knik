import type { Schedule, ScheduleCreateRequest } from '$types/workflow'

/** Props for the schedule list component. */
export interface ScheduleListProps {
  schedules: Schedule[]
  loading: boolean
  workflowNames: Record<string, string>
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onRun: (workflowId: string) => void
}

/** Props for a single schedule card. */
export interface ScheduleCardProps {
  schedule: Schedule
  workflowName?: string
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onRun: (workflowId: string) => void
}

/** Props for the schedule create/edit form modal. */
export interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ScheduleCreateRequest) => Promise<void>
  workflows: Array<{ id: string; name: string }>
  initialData?: Schedule
  loading?: boolean
}

/** A single scheduled job in the demo schedule list. */
export interface ScheduleJob {
  id: string
  name: string
  cron: string
  nextRun: string
  active: boolean
  lastStatus?: 'success' | 'failed' | 'running'
}

/** Props for the demo schedule list (ScheduleJob-based, distinct from ScheduleListProps). */
export interface ScheduleJobListProps {
  schedules: ScheduleJob[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onToggle?: (id: string, active: boolean) => void
  className?: string
}
