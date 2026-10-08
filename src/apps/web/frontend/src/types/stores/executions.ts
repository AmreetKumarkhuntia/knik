import type { ExecutionDetail, NodeExecutionStep } from '$types/workflow'
import type { DemoRunScenario, DemoActionResult } from '$types/demo-session'
export interface ExecutionScope {
  page: number
  workflowId: string
  status: string
  sort: 'newest' | 'oldest'
}
export interface ExecutionStore {
  executions: ExecutionDetail[]
  timelines: Partial<Record<string, NodeExecutionStep[]>>
  runScenarios: Partial<Record<string, DemoRunScenario>>
  scopes: Partial<Record<string, ExecutionScope>>
  initScope: (scope: string) => void
  disposeScope: (scope: string) => void
  patchScope: (scope: string, patch: Partial<ExecutionScope>) => void
  commitScenario: (scenario: DemoRunScenario) => DemoActionResult
}
