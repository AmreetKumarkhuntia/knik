export type NodeTypeName =
  | 'FunctionExecutionNode'
  | 'ConditionalBranchNode'
  | 'FlowMergeNode'
  | 'AIExecutionNode'
  | 'StartNode'
  | 'EndNode'

export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed'

export interface FunctionNodeDefinition {
  type: 'FunctionExecutionNode'
  function_name: string
  params?: Record<string, unknown>
  code?: string
}

export interface ConditionalNodeDefinition {
  type: 'ConditionalBranchNode'
  condition: string
}

export interface MergeNodeDefinition {
  type: 'FlowMergeNode'
  merge_strategy?: 'concat' | 'overwrite'
}

export interface AINodeDefinition {
  type: 'AIExecutionNode'
  prompt: string
  model?: string
  temperature?: number
  use_tools?: boolean
}

export type NodeDefinition =
  | FunctionNodeDefinition
  | ConditionalNodeDefinition
  | MergeNodeDefinition
  | AINodeDefinition

export interface WorkflowConnection {
  from_id: string
  to_id: string
  condition?: string
}

export type Connection = WorkflowConnection

export interface WorkflowDefinition {
  nodes: Record<string, NodeDefinition>
  connections: WorkflowConnection[]
}

export interface Workflow {
  id: string
  name: string
  description?: string
  definition: WorkflowDefinition
  created_at?: string
  updated_at?: string
  last_executed_at?: string
}

export interface Schedule {
  id: number
  workflow_id: string
  trigger_workflow_id: string
  enabled: boolean
  timezone: string
  created_at?: string
  updated_at?: string
  last_executed_at?: string
}

export interface ExecutionRecord {
  id: number
  workflow_id: string
  status: ExecutionStatus
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
}

export interface NodeExecutionRecord {
  id: number
  execution_id: number
  node_id: string
  node_type: NodeTypeName
  status: ExecutionStatus
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
}

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

export interface WorkflowListResponse {
  success: boolean
  workflows: Pick<Workflow, 'id' | 'name' | 'description'>[]
  total: number
}

export interface WorkflowDetailResponse {
  success: boolean
  workflow: WorkflowDefinition
}

export interface SchedulesListResponse {
  success: boolean
  schedules: Schedule[]
  total: number
}

export interface ExecutionHistoryResponse {
  success: boolean
  history: ExecutionRecord[]
  total: number
}

export interface WorkflowExecuteRequest {
  inputs?: Record<string, unknown>
}

export interface WorkflowExecuteResponse {
  success: boolean
  result?: Record<string, unknown>
  error?: string
}

export interface ScheduleCreateRequest {
  workflow_id: string
  trigger_workflow_id: string
  timezone?: string
}

export interface ScheduleCreateResponse {
  success: boolean
  schedule_id: number
  workflow_id: string
}

export interface WorkflowMetrics {
  totalWorkflows: number
  executionsToday: number
  successRate: number
  avgDurationMs?: number
  activeExecutions?: number
  totalExecutions?: number
}

export interface DashboardWorkflow {
  id: string
  name: string
  lastExecutedAt?: string
  totalExecutions: number
  status: 'active' | 'inactive'
}

export interface DashboardExecution {
  id: number
  workflowId: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  durationMs?: number
}

export interface DashboardResponse {
  success: boolean
  data: {
    metrics: WorkflowMetrics
    recentWorkflows: DashboardWorkflow[]
    recentExecutions: DashboardExecution[]
  }
}

// Execution detail types
export interface ExecutionDetail {
  id: number
  workflow_id: string
  workflow_name: string
  status: ExecutionStatus
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  error_message?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
}

export interface NodeExecutionStep {
  node_id: string
  node_type: string
  status: ExecutionStatus
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  error_message?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
}

export interface ExecutionDetailResponse {
  success: boolean
  execution: ExecutionDetail
  timeline: NodeExecutionStep[]
}

// Dynamic metric card
export interface DynamicMetric {
  id: string
  label: string
  value: string | number
  icon: string
  color?: 'primary' | 'teal' | 'rose' | 'blue'
  subtext?: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
    icon?: string
  }
}

// Paginated executions
export interface ExecutionsPaginatedResponse {
  success: boolean
  data: {
    executions: DashboardExecution[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

// Workflows list for filters
export interface WorkflowsListResponse {
  success: boolean
  workflows: Array<{ id: string; name: string }>
}

// Analytics response types
export interface WorkflowMetricsResponse {
  success: boolean
  metrics: Record<string, unknown>
}

export interface TopWorkflowsResponse {
  success: boolean
  workflows: unknown[]
  total: number
}

export interface ActivityResponse {
  success: boolean
  activities: unknown[]
}
