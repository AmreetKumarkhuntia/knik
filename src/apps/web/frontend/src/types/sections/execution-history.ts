import type { ExecutionRecord, DashboardExecution } from '$types/workflow'

/** Props for the execution detail slide-over panel. */
export interface ExecutionDetailProps {
  execution: ExecutionRecord | null
  isOpen: boolean
  onClose: () => void
}

/** Props for the execution history data table. */
export interface HistoryTableProps {
  executions: DashboardExecution[]
  loading: boolean
  onViewDetail: (execution: DashboardExecution) => void
  onRetry?: (execution: DashboardExecution) => void
  maxHeight?: string
}
