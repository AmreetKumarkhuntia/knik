import type { ExecutionRecord, DashboardExecution } from '$types/workflow'

export interface ExecutionDetailProps {
  execution: ExecutionRecord | null
  isOpen: boolean
  onClose: () => void
}

export interface HistoryTableProps {
  executions: DashboardExecution[]
  loading: boolean
  onViewDetail: (execution: DashboardExecution) => void
  onRetry?: (execution: DashboardExecution) => void
  maxHeight?: string
}
