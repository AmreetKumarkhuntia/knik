import type { DomainStores, SessionCommands } from '$types/stores/session'
import { createScheduleCommand } from '../schedules/actions'
import { createRunWorkflowCommand } from '../executions/actions'

export function createSessionCommands(stores: DomainStores): SessionCommands {
  return {
    createSchedule: createScheduleCommand(stores),
    runWorkflow: createRunWorkflowCommand(stores),
    sendMessage(scopeId) {
      const models = stores.catalogs.getState().models
      const selected = stores.settings.getState().settings.model || models[0]?.id
      const modelId = models.find(model => model.id === selected)?.id
      return stores.chat.getState().sendMessage(scopeId, modelId)
    },
  }
}
