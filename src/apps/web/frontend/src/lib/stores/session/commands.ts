import type { DomainStores, SessionCommands } from '$types/stores/session'
import { createScheduleCommand } from '../schedules/actions'
import { createRunWorkflowCommand } from '../executions/actions'
import { effectiveModelId } from '../catalogs/selectors'

export function createSessionCommands(stores: DomainStores): SessionCommands {
  return {
    createSchedule: createScheduleCommand(stores),
    runWorkflow: createRunWorkflowCommand(stores),
    sendMessage(scopeId) {
      const modelId = effectiveModelId(
        stores.settings.getState().settings.model,
        stores.catalogs.getState().models
      )
      return stores.chat.getState().sendMessage(scopeId, modelId)
    },
  }
}
