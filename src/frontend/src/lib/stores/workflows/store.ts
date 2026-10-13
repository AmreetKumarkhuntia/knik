import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { WorkflowStore } from '$types/stores/workflows'
import { workflowActions } from './actions'
export function createWorkflowStore(seed: DemoSnapshot) {
  return createStore<WorkflowStore>()((set, get) => ({
    workflows: structuredClone(seed.workflows),
    scenarioDefinitions: Object.fromEntries(
      seed.workflows.map(workflow => [workflow.id, structuredClone(workflow.definition)])
    ),
    builderScopes: {},
    hubScopes: {},
    ...workflowActions(set, get),
  }))
}
