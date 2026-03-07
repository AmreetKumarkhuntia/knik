import type { Schedule, ExecutionRecord, Workflow } from '$types/workflow'

export interface UseWorkflowsReturn {
  workflows: Pick<Workflow, 'id' | 'name' | 'description'>[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseSchedulesReturn {
  schedules: Schedule[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  toggleSchedule: (id: number, enabled: boolean) => Promise<void>
  deleteSchedule: (id: number) => Promise<void>
}

export interface UseExecutionsReturn {
  executions: ExecutionRecord[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseRealtimeStatusReturn {
  schedules: Array<{ id: number; last_status?: string; last_error?: string }>
  isConnected: boolean
}
