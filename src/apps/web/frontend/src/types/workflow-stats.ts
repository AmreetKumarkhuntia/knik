import type { WorkflowStatsResponse } from '$types/workflow'

export interface WorkflowStats {
  totalExecutions: number
  activeJobs: number
  successRate: string
  hasData: boolean
}

export interface WorkflowStatsResponse {
  success: boolean
  stats: WorkflowStats
}
