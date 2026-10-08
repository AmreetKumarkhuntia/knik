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
export interface TerminalNodeDefinition {
  type: 'StartNode' | 'EndNode'
  label?: string
}

export type NodeDefinition =
  | TerminalNodeDefinition
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
  canvasPositions?: Record<string, { x: number; y: number }>
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

/** Aggregate metrics for the workflow dashboard. */
export interface WorkflowMetrics {
  totalWorkflows: number
  executionsToday: number
  successRate: number
  avgDurationMs?: number
  activeExecutions?: number
  totalExecutions?: number
}

/** A row in the WorkflowHub table: workflow identity merged with execution stats. */
export interface HubWorkflowRow {
  id: string
  name: string
  description: string
  totalExecutions: number
  status: 'active' | 'inactive'
  lastExecutedAt?: string
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

/** Result of validating a workflow definition. */
export interface WorkflowValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ExecutionSnapshot {
  execution: ExecutionDetail
  timeline: NodeExecutionStep[]
}
