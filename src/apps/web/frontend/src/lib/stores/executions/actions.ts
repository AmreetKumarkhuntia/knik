import type { StoreApi } from 'zustand/vanilla'
import type { ExecutionStore, ExecutionScope, ExecutionDetailScope } from '$types/stores/executions'
import type { WorkflowStore } from '$types/stores/workflows'
import type { DemoActionResult } from '$types/demo-session'
import { scopeSlice } from '../session/scopes'
import { createExecutionScope, createExecutionDetailScope } from './selectors'
import { definitionsMatch } from '$utils/workflowDefinition'
export function executionActions(
  set: StoreApi<ExecutionStore>['setState']
): Omit<ExecutionStore, 'executions' | 'timelines' | 'runScenarios' | 'scopes' | 'detailScopes'> {
  const scopes = scopeSlice<ExecutionStore, ExecutionScope>(set)
  const details = scopeSlice<ExecutionStore, ExecutionDetailScope>(set, 'detailScopes')
  return {
    initDetailScope: scope => details.init(scope, createExecutionDetailScope()),
    disposeDetailScope: details.dispose,
    patchDetailScope: details.patch,
    initScope: scope => scopes.init(scope, createExecutionScope()),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    commitScenario: scenario => {
      const { execution, timeline } = structuredClone(scenario)
      set(state => ({
        executions: [...state.executions.filter(record => record.id !== execution.id), execution],
        timelines: { ...state.timelines, [execution.id]: timeline },
      }))
      return { ok: true, id: execution.id }
    },
  }
}
export function createRunWorkflowCommand(stores: {
  workflows: StoreApi<WorkflowStore>
  executions: StoreApi<ExecutionStore>
}) {
  return (id: string): DemoActionResult => {
    const workflows = stores.workflows.getState()
    const workflow = workflows.workflows.find(record => record.id === id)
    const scenario = stores.executions.getState().runScenarios[id]
    if (!workflow || !scenario || scenario.execution.workflow_id !== id)
      return { ok: false, error: 'No demo run is supplied for this workflow.' }
    if (!definitionsMatch(workflow.definition, workflows.scenarioDefinitions[id]))
      return {
        ok: false,
        error: 'This workflow has changed. Supply a matching demo run before running it.',
      }
    return stores.executions.getState().commitScenario(scenario)
  }
}
