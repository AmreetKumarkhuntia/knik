import type { DemoSource } from '$types/stores/demo'
import { demoCatalogs } from './catalogs'
import { demoChat } from './chat'
import { demoWorkflows } from './workflows'
import { demoSchedules } from './schedules'
import { demoExecutions } from './executions'
import { demoSettings } from './settings'
import { normalizeDemoSource } from './normalize'
import { freezeSeed, validateDemoSource } from './validate'

export const bundledDemoSource: DemoSource = freezeSeed({
  ...demoCatalogs,
  ...demoChat,
  workflows: demoWorkflows,
  schedules: demoSchedules,
  ...demoExecutions,
  ...demoSettings,
})

export function createDemoSeed(source: DemoSource = bundledDemoSource) {
  const seed = normalizeDemoSource(source)
  validateDemoSource(seed)
  return freezeSeed(seed)
}
