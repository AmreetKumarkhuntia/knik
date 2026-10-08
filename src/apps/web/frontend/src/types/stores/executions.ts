import type { ExecutionDetail, NodeExecutionStep } from '$types/workflow'
import type { DemoRunScenario, DemoActionResult } from '$types/demo-session'
export interface ExecutionScope {
  page: number
  workflowId: string
  status: string
  sort: 'newest' | 'oldest'
}
export type ExecutionDetailTab = 'inputs' | 'outputs' | 'timeline'
export interface ExecutionDetailScope {
  tab: ExecutionDetailTab
  collapsed: boolean
}
export interface ExecutionStore {
  executions: ExecutionDetail[]
  timelines: Partial<Record<string, NodeExecutionStep[]>>
  runScenarios: Partial<Record<string, DemoRunScenario>>
  scopes: Partial<Record<string, ExecutionScope>>
  detailScopes: Partial<Record<string, ExecutionDetailScope>>
  initDetailScope: (scope: string) => void
  disposeDetailScope: (scope: string) => void
  patchDetailScope: (scope: string, patch: Partial<ExecutionDetailScope>) => void
  initScope: (scope: string) => void
  disposeScope: (scope: string) => void
  patchScope: (scope: string, patch: Partial<ExecutionScope>) => void
  commitScenario: (scenario: DemoRunScenario) => DemoActionResult
}
