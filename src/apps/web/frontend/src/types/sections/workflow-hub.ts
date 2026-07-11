import type { DashboardExecution, HubWorkflowRow, WorkflowMetrics } from '$types/workflow'

/** Props for the hub metric strip. */
export interface HubMetricStripProps {
  metrics: WorkflowMetrics | null
  loading: boolean
}

/** Props for the hub toolbar (title/count + search + filter). */
export interface HubToolbarProps {
  shown: number
  total: number
  query: string
  onQueryChange: (v: string) => void
  filter: string
  onFilterChange: (v: string) => void
}

/** Props for the hub workflows table. */
export interface HubWorkflowsTableProps {
  rows: HubWorkflowRow[]
  loading: boolean
  error: string | null
  isEmpty: boolean
}

/** Props for the hub recent-executions feed. */
export interface HubRecentExecutionsProps {
  executions: DashboardExecution[]
  loading: boolean
}
