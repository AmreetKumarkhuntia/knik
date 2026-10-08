import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { ExecutionStore } from '$types/stores/executions'
import { executionActions } from './actions'
export function createExecutionStore(seed: DemoSnapshot) {
  return createStore<ExecutionStore>()((set, get) => ({
    executions: structuredClone(seed.executions),
    timelines: structuredClone(seed.timelines),
    runScenarios: structuredClone(seed.runScenarios),
    scopes: {},
    ...executionActions(set, get),
  }))
}
