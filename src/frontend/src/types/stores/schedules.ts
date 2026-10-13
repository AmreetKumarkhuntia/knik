import type { Schedule } from '$types/workflow'
import type { ScheduleDraft, DemoActionResult } from '$types/demo-session'
export interface ScheduleScope {
  creating: boolean
  deletingId: number | null
  draft: ScheduleDraft
  error: string | null
}
export interface ScheduleStore {
  schedules: Schedule[]
  scopes: Partial<Record<string, ScheduleScope>>
  initScope: (scope: string) => void
  disposeScope: (scope: string) => void
  patchScope: (scope: string, patch: Partial<ScheduleScope>) => void
  closeCreate: (scope: string) => void
  addSchedule: (draft: ScheduleDraft) => DemoActionResult
  toggleSchedule: (id: number, enabled: boolean) => void
  deleteSchedule: (id: number) => void
}
