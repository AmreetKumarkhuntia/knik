import type { DashboardExecution, ExecutionDetail, Workflow } from '$types/workflow'
import type { ExecutionScope } from '$types/stores/executions'
export function createExecutionScope(): ExecutionScope {
  return { page: 1, workflowId: '', status: 'all', sort: 'newest' }
}
export function toExecutionSummary(
  execution: ExecutionDetail,
  workflows: Workflow[]
): DashboardExecution {
  return {
    id: execution.id,
    workflowId: execution.workflow_id,
    workflowName:
      workflows.find(workflow => workflow.id === execution.workflow_id)?.name ??
      'Unavailable workflow',
    status: execution.status,
    startedAt: execution.started_at,
    durationMs: execution.duration_ms,
  }
}
