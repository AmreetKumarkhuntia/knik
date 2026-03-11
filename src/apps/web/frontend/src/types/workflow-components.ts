import type {
  FunctionNodeDefinition,
  ConditionalNodeDefinition,
  MergeNodeDefinition,
  AINodeDefinition,
  NodeTypeName,
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
export interface NodePaletteProps {
  onDragStart: (nodeType: NodeTypeName | 'StartNode' | 'EndNode') => void
}

export interface WorkflowsTableProps {
  workflows: DashboardWorkflow[]
  onEdit: (workflowId: string) => void
  onDelete: (workflowId: string, workflowName: string) => void
}

export interface NodeTypeItemProps {
  icon: string
  label: string
  typeLabel: string
  type: NodeTypeName | 'StartNode' | 'EndNode'
  onDragStart: (type: NodeTypeName | 'StartNode' | 'EndNode') => void
  iconColor?: string
  iconBgColor?: string
  hoverBorderColor?: string
  isGradient?: boolean
}
