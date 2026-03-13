import type {
  FunctionNodeDefinition,
  ConditionalNodeDefinition,
  MergeNodeDefinition,
  AINodeDefinition,
  DashboardWorkflow,
} from './workflow'

// Workflow node data types - extend node definitions with label
export interface FunctionNodeData extends FunctionNodeDefinition {
  label?: string
}

export interface ConditionalNodeData extends ConditionalNodeDefinition {
  label?: string
}

export interface MergeNodeData extends MergeNodeDefinition {
  label?: string
}

export interface AINodeData extends AINodeDefinition {
  label?: string
}

export interface StartNodeData {
  label?: string
}

export interface EndNodeData {
  label?: string
}

// Workflow dashboard types
export type TabType = 'schedules' | 'history' | 'builder'

// Workflow component props
export interface WorkflowsTableProps {
  workflows: DashboardWorkflow[]
  onEdit: (workflowId: string) => void
  onDelete: (workflowId: string, workflowName: string) => void
}
