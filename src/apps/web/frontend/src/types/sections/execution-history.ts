import type { DashboardExecution } from '$types/workflow'

/** Props for the execution history data table. */
export interface HistoryTableProps {
  executions: DashboardExecution[]
  loading: boolean
  onViewDetail: (execution: DashboardExecution) => void
  maxHeight?: string
}

/** Props for the all-executions filter bar. */
export interface ExecutionsFilterBarProps {
  workflows: Array<{ id: string; name: string }>
  selectedWorkflow: string
  selectedStatus: string
  onWorkflowChange: (v: string) => void
  onStatusChange: (v: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  loading: boolean
  shownCount: number
  totalCount: number
}
