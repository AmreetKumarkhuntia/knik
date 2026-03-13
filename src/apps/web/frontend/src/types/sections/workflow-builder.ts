import type { WorkflowDefinition } from '$types/workflow'
import type { Node } from '@xyflow/react'

export interface CanvasHandle {
  getWorkflowDefinition: () => WorkflowDefinition | null
  getValidationErrors: () => string[]
}

export interface CanvasProps {
  workflowId?: string
  definition?: WorkflowDefinition
  onSave?: () => void
  onExecute?: () => void
  readOnly?: boolean
  workflowName?: string
  onExportJson?: () => void
}

export interface NodePropertiesProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
}

export interface ConfigurationFormProps {
  nodeType: string
  data: Record<string, unknown>
  onDataChange: (field: string, value: unknown) => void
}

export interface WorkflowNavbarProps {
  onSave?: () => void
  onExecute?: () => void
  onExportJson?: () => void
  readOnly?: boolean
  userAvatar?: string
  workflowName?: string
}
