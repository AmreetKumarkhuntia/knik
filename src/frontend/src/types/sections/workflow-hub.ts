import type { HubWorkflowRow, WorkflowMetrics } from '$types/workflow'

/** Props for the hub metric strip. */
export interface HubMetricStripProps {
  metrics: WorkflowMetrics | null
}

/** Props for the hub workflows table. */
export interface HubWorkflowsTableProps {
  rows: HubWorkflowRow[]
  isEmpty: boolean
  onRun: (id: string) => void
  canRun: (id: string) => boolean
}
