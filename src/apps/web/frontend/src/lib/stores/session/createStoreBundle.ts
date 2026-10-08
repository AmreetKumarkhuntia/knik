import type { DemoSource } from '$types/stores/demo'
import type { DomainStores, StoreBundle } from '$types/stores/session'
import { createDemoSeed } from '../demo'
import { createCatalogStore } from '../catalogs/store'
import { createChatStore } from '../chat/store'
import { createWorkflowStore } from '../workflows/store'
import { createScheduleStore } from '../schedules/store'
import { createExecutionStore } from '../executions/store'
import { createSettingsStore } from '../settings/store'
import { createCredentialsStore } from '../credentials/store'
import { createShellStore } from '../shell/store'
import { createFeedbackStore } from '../feedback/store'
import { createSessionCommands } from './commands'

export function createStoreBundle(source?: DemoSource): StoreBundle {
  const seed = createDemoSeed(source)
  const stores: DomainStores = {
    catalogs: createCatalogStore(seed),
    chat: createChatStore(seed),
    workflows: createWorkflowStore(seed),
    schedules: createScheduleStore(seed),
    executions: createExecutionStore(seed),
    settings: createSettingsStore(seed),
    credentials: createCredentialsStore(seed),
    shell: createShellStore(seed),
    feedback: createFeedbackStore(seed),
  }
  return { ...stores, commands: createSessionCommands(stores) }
}
