import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useScheduleStore } from '../schedules/hooks'
import { useWorkflowStore } from '../workflows/hooks'
import { createScheduleScope } from '../schedules/selectors'
import { useStoreBundle } from '../session/useStoreBundle'
import { useWidgetScope } from '../session/useWidgetScope'
import type { ScheduleDraft } from '$types/demo-session'
export function useSchedulesView() {
  const state = useScheduleStore(
    useShallow(state => ({
      schedules: state.schedules,
      initScope: state.initScope,
      disposeScope: state.disposeScope,
      patchScope: state.patchScope,
      closeCreate: state.closeCreate,
      toggleSchedule: state.toggleSchedule,
      deleteSchedule: state.deleteSchedule,
    }))
  )
  const workflows = useWorkflowStore(state => state.workflows)
  const scope = useWidgetScope(state.initScope, state.disposeScope)
  const view = useScheduleStore(state => state.scopes[scope]) ?? createScheduleScope()
  const commands = useStoreBundle().commands
  const workflowNames = useMemo(
    () => Object.fromEntries(workflows.map(workflow => [workflow.id, workflow.name])),
    [workflows]
  )
  return {
    ...view,
    schedules: state.schedules,
    workflows,
    workflowNames,
    open: () => state.patchScope(scope, { creating: true }),
    close: () => state.closeCreate(scope),
    setDraft: (draft: ScheduleDraft) => state.patchScope(scope, { draft }),
    setDeleting: (deletingId: number | null) => state.patchScope(scope, { deletingId }),
    toggle: state.toggleSchedule,
    confirmDelete: () => {
      if (view.deletingId !== null) state.deleteSchedule(view.deletingId)
      state.patchScope(scope, { deletingId: null })
    },
    save: () => commands.createSchedule(scope),
  }
}
