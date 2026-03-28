import type {
  FunctionNodeDefinition,
  ConditionalNodeDefinition,
  MergeNodeDefinition,
  AINodeDefinition,
  DashboardWorkflow,
} from './workflow'

/** Runtime data for a function node on the canvas. */
export interface FunctionNodeData extends FunctionNodeDefinition {
  label?: string
}

/** Runtime data for a conditional node on the canvas. */
export interface ConditionalNodeData extends ConditionalNodeDefinition {
  label?: string
}

/** Runtime data for a merge node on the canvas. */
export interface MergeNodeData extends MergeNodeDefinition {
  label?: string
}

/** Runtime data for an AI node on the canvas. */
export interface AINodeData extends AINodeDefinition {
  label?: string
}

/** Runtime data for a start node on the canvas. */
export interface StartNodeData {
  label?: string
}

/** Runtime data for an end node on the canvas. */
export interface EndNodeData {
  label?: string
}

/** Tab identifiers for the workflow detail view. */
export type TabType = 'schedules' | 'history' | 'builder'

/** Props for the workflows data table. */
export interface WorkflowsTableProps {
  workflows: DashboardWorkflow[]
  onEdit: (workflowId: string) => void
  onDelete: (workflowId: string, workflowName: string) => void
}
