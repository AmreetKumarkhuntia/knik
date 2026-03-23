import type { Schedule, ScheduleCreateRequest } from '$types/workflow'

export interface ScheduleListProps {
  schedules: Schedule[]
  loading: boolean
  workflowNames: Record<string, string>
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onRun: (workflowId: string) => void
}

export interface ScheduleCardProps {
  schedule: Schedule
  workflowName?: string
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: number) => void
  onRun: (workflowId: string) => void
}

export interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ScheduleCreateRequest) => Promise<void>
  workflows: Array<{ id: string; name: string }>
  initialData?: Schedule
  loading?: boolean
}
