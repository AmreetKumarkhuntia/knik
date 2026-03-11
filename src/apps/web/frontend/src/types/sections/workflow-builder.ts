import type { WorkflowDefinition } from '$types/workflow'
import type { Node } from '@xyflow/react'

export interface CanvasHandle {
  getWorkflowDefinition: () => WorkflowDefinition | null
  getValidationErrors: () => string[]
}

export interface CanvasProps {
  workflowId?: string
  definition?: WorkflowDefinition
  onSave?: (definition: WorkflowDefinition) => void
  onExecute?: () => void
  readOnly?: boolean
}

export interface NodePropertiesProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
}

export interface PropertiesPanelProps {
  selectedNode: Node | null
  isOpen: boolean
  onClose: () => void
  onNodeUpdate: (nodeId: string, data: Record<string, unknown>) => void
}

export interface ConfigurationFormProps {
  nodeType: string
  data: Record<string, unknown>
  onDataChange: (field: string, value: unknown) => void
}

export interface WorkflowNavbarProps {
  onSave?: () => void
  onExecute?: () => void
  readOnly?: boolean
  userAvatar?: string
}
