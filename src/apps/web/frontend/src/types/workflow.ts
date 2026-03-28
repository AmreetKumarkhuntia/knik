/** Supported workflow node type names. */
export type NodeTypeName =
  | 'FunctionExecutionNode'
  | 'ConditionalBranchNode'
  | 'FlowMergeNode'
  | 'AIExecutionNode'
  | 'StartNode'
  | 'EndNode'

/** Status values for workflow execution. */
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed'

/** Definition for a function execution node. */
export interface FunctionNodeDefinition {
  type: 'FunctionExecutionNode'
  function_name: string
  params?: Record<string, unknown>
  code?: string
}

/** Definition for a conditional branch node. */
export interface ConditionalNodeDefinition {
  type: 'ConditionalBranchNode'
  condition: string
}

/** Definition for a flow merge node. */
export interface MergeNodeDefinition {
  type: 'FlowMergeNode'
  merge_strategy?: 'concat' | 'overwrite'
}

/** Definition for an AI execution node. */
export interface AINodeDefinition {
  type: 'AIExecutionNode'
  prompt: string
  model?: string
  temperature?: number
  use_tools?: boolean
}

/** Union of all node definition types. */
export type NodeDefinition =
  | FunctionNodeDefinition
  | ConditionalNodeDefinition
  | MergeNodeDefinition
  | AINodeDefinition

/** A directed connection between two workflow nodes. */
export interface WorkflowConnection {
  from_id: string
  to_id: string
  condition?: string
}

/** Alias for a workflow connection. */
export type Connection = WorkflowConnection

/** The nodes and connections that define a workflow. */
export interface WorkflowDefinition {
  nodes: Record<string, NodeDefinition>
  connections: WorkflowConnection[]
}

/** A saved workflow with metadata. */
export interface Workflow {
  id: string
  name: string
  description?: string
  definition: WorkflowDefinition
  created_at?: string
  updated_at?: string
  last_executed_at?: string
}

/** A recurring schedule attached to a workflow. */
export interface Schedule {
  id: number
  target_workflow_id: string
  enabled: boolean
  timezone: string
  schedule_description?: string
  next_run_at?: string
  recurrence_seconds?: number
  created_at?: string
  updated_at?: string
  last_executed_at?: string
}

/** A record of a single workflow execution. */
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

/** A record of a single node's execution within a workflow run. */
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

/** Response containing node-level execution records. */
export interface NodeExecutionsResponse {
  node_executions: NodeExecutionRecord[]
}

/** Aggregate statistics for a workflow. */
export interface WorkflowStats {
  totalExecutions: number
  activeJobs: number
  successRate: string
  hasData: boolean
}

/** API response for workflow statistics. */
export interface WorkflowStatsResponse {
  success: boolean
  stats: WorkflowStats
}

/** API response listing workflows. */
export interface WorkflowListResponse {
  success: boolean
  workflows: Pick<Workflow, 'id' | 'name' | 'description'>[]
  total: number
}

/** API response with a single workflow definition. */
export interface WorkflowDetailResponse {
  success: boolean
  workflow: WorkflowDefinition
}

/** API response listing schedules. */
export interface SchedulesListResponse {
  success: boolean
  schedules: Schedule[]
  total: number
}

/** API response for execution history. */
export interface ExecutionHistoryResponse {
  success: boolean
  history: ExecutionRecord[]
  total: number
}

/** Request payload for executing a workflow. */
export interface WorkflowExecuteRequest {
  inputs?: Record<string, unknown>
}

/** API response after executing a workflow. */
export interface WorkflowExecuteResponse {
  success: boolean
  result?: Record<string, unknown>
  error?: string
}

/** Request payload for creating a schedule. */
export interface ScheduleCreateRequest {
  target_workflow_id: string
  schedule_description: string
  timezone?: string
}

/** API response after creating a schedule. */
export interface ScheduleCreateResponse {
  success: boolean
  schedule_id: number
  next_run_at?: string
  recurrence_seconds?: number
}

/** Aggregate metrics for the workflow dashboard. */
export interface WorkflowMetrics {
  totalWorkflows: number
  executionsToday: number
  successRate: number
  avgDurationMs?: number
  activeExecutions?: number
  totalExecutions?: number
}

/** A workflow summary used on the dashboard. */
export interface DashboardWorkflow {
  id: string
  name: string
  lastExecutedAt?: string
  totalExecutions: number
  status: 'active' | 'inactive'
}

/** An execution summary used on the dashboard. */
export interface DashboardExecution {
  id: number
  workflowId: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  durationMs?: number
}

/** API response for the main dashboard view. */
export interface DashboardResponse {
  success: boolean
  data: {
    metrics: WorkflowMetrics
    recentWorkflows: DashboardWorkflow[]
    recentExecutions: DashboardExecution[]
  }
}

/** Detailed information about a single execution. */
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

/** A single step in an execution timeline. */
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

/** API response for a full execution detail with timeline. */
export interface ExecutionDetailResponse {
  success: boolean
  execution: ExecutionDetail
  timeline: NodeExecutionStep[]
}

/** A dynamic metric displayed on the dashboard. */
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

/** Paginated API response for executions. */
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

/** Simple API response listing workflow id/name pairs. */
export interface WorkflowsListResponse {
  success: boolean
  workflows: Array<{ id: string; name: string }>
}

/** API response for workflow metrics. */
export interface WorkflowMetricsResponse {
  success: boolean
  metrics: Record<string, unknown>
}

/** API response for top workflows. */
export interface TopWorkflowsResponse {
  success: boolean
  workflows: unknown[]
  total: number
}

/** API response for recent activity. */
export interface ActivityResponse {
  success: boolean
  activities: unknown[]
}

/** Result of validating a workflow definition. */
export interface WorkflowValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
