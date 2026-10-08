import type { StoreApi } from 'zustand/vanilla'
import type { ScheduleStore } from '$types/stores/schedules'
import type { WorkflowStore } from '$types/stores/workflows'
import type { DemoActionResult } from '$types/demo-session'
import { createScheduleScope } from './selectors'
export function scheduleActions(
  set: StoreApi<ScheduleStore>['setState'],
  get: StoreApi<ScheduleStore>['getState']
): Omit<ScheduleStore, 'schedules' | 'scopes'> {
  return {
    initScope: scope => {
      if (!get().scopes[scope])
        set(state => ({ scopes: { ...state.scopes, [scope]: createScheduleScope() } }))
    },
    disposeScope: scope =>
      set(state => {
        const next = { ...state.scopes }
        delete next[scope]
        return { scopes: next }
      }),
    patchScope: (scope, patch) =>
      set(state =>
        state.scopes[scope]
          ? { scopes: { ...state.scopes, [scope]: { ...state.scopes[scope], ...patch } } }
          : {}
      ),
    closeCreate: scope => get().patchScope(scope, createScheduleScope()),
    addSchedule: draft => {
      const id = Math.max(0, ...get().schedules.map(schedule => schedule.id)) + 1
      set(state => ({
        schedules: [
          ...state.schedules,
          { ...structuredClone(draft), id, timezone: draft.timezone || 'UTC', enabled: true },
        ],
      }))
      return { ok: true, id }
    },
    toggleSchedule: (id, enabled) =>
      set(state => ({
        schedules: state.schedules.map(schedule =>
          schedule.id === id ? { ...schedule, enabled } : schedule
        ),
      })),
    deleteSchedule: id =>
      set(state => ({ schedules: state.schedules.filter(schedule => schedule.id !== id) })),
  }
}
export function createScheduleCommand(stores: {
  workflows: StoreApi<WorkflowStore>
  schedules: StoreApi<ScheduleStore>
}) {
  return (scope: string): DemoActionResult => {
    const session = stores.schedules.getState()
    const draft = session.scopes[scope]?.draft
    let error: string | null = null
    if (!draft) return { ok: false, error: 'The schedule form is no longer open.' }
    if (
      !stores.workflows
        .getState()
        .workflows.some(workflow => workflow.id === draft.target_workflow_id)
    )
      error = 'Select a workflow available in this session.'
    else if (!draft.schedule_description.trim()) error = 'Enter a schedule description.'
    const timezone = draft.timezone?.trim() || 'UTC'
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format()
    } catch {
      error = 'Enter a valid timezone, such as UTC or Asia/Kolkata.'
    }
    if (error) {
      session.patchScope(scope, { error })
      return { ok: false, error }
    }
    const result = session.addSchedule({
      ...draft,
      timezone,
      schedule_description: draft.schedule_description.trim(),
    })
    if (result.ok) session.closeCreate(scope)
    return result
  }
}
