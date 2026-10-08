import type { DashboardExecution, ExecutionDetail } from '$types/workflow'

export function toExecutionSummary(execution: ExecutionDetail): DashboardExecution {
  return {
    id: execution.id,
    workflowId: execution.workflow_id,
    workflowName: execution.workflow_name,
    status: execution.status,
    startedAt: execution.started_at,
    durationMs: execution.duration_ms,
  }
}
