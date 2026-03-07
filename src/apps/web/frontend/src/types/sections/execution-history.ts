import type { ExecutionRecord } from '$types/workflow'

export interface ExecutionDetailProps {
  execution: ExecutionRecord | null
  isOpen: boolean
  onClose: () => void
}

export interface HistoryTableProps {
  executions: ExecutionRecord[]
  loading: boolean
  onViewDetail: (execution: ExecutionRecord) => void
  onRetry?: (execution: ExecutionRecord) => void
}
