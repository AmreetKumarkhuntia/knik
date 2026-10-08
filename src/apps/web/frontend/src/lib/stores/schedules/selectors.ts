import type { ScheduleScope } from '$types/stores/schedules'
export function createScheduleScope(): ScheduleScope {
  return {
    creating: false,
    deletingId: null,
    draft: { target_workflow_id: '', schedule_description: '', timezone: 'UTC' },
    error: null,
  }
}
