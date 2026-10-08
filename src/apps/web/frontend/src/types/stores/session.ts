import type { createCatalogStore } from '$lib/stores/catalogs/store'
import type { createChatStore } from '$lib/stores/chat/store'
import type { createWorkflowStore } from '$lib/stores/workflows/store'
import type { createScheduleStore } from '$lib/stores/schedules/store'
import type { createExecutionStore } from '$lib/stores/executions/store'
import type { createSettingsStore } from '$lib/stores/settings/store'
import type { createCredentialsStore } from '$lib/stores/credentials/store'
import type { createShellStore } from '$lib/stores/shell/store'
import type { createFeedbackStore } from '$lib/stores/feedback/store'
import type { DemoActionResult } from './demo'

export interface DomainStores {
  catalogs: ReturnType<typeof createCatalogStore>
  chat: ReturnType<typeof createChatStore>
  workflows: ReturnType<typeof createWorkflowStore>
  schedules: ReturnType<typeof createScheduleStore>
  executions: ReturnType<typeof createExecutionStore>
  settings: ReturnType<typeof createSettingsStore>
  credentials: ReturnType<typeof createCredentialsStore>
  shell: ReturnType<typeof createShellStore>
  feedback: ReturnType<typeof createFeedbackStore>
}
export interface SessionCommands {
  sendMessage: (scopeId: string) => DemoActionResult
  createSchedule: (scopeId: string) => DemoActionResult
  runWorkflow: (workflowId: string) => DemoActionResult
}
export interface StoreBundle extends DomainStores {
  commands: SessionCommands
}
