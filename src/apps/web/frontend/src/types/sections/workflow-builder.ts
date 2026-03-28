import type { WorkflowDefinition } from '$types/workflow'
import type { Node } from '@xyflow/react'

/** Imperative handle exposed by the workflow canvas via ref. */
export interface CanvasHandle {
  getWorkflowDefinition: () => WorkflowDefinition | null
  getValidationErrors: () => string[]
}

/** Props for the workflow canvas component. */
export interface CanvasProps {
  workflowId?: string
  definition?: WorkflowDefinition
  onSave?: () => void
  onExecute?: () => void
  readOnly?: boolean
  workflowName?: string
  onExportJson?: () => void
}

/** Props for the node properties sidebar panel. */
export interface NodePropertiesProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
}

/** Props for the node configuration form. */
export interface ConfigurationFormProps {
  nodeType: string
  data: Record<string, unknown>
  onDataChange: (field: string, value: unknown) => void
}

/** Props for the workflow builder navigation bar. */
export interface WorkflowNavbarProps {
  onSave?: () => void
  onExecute?: () => void
  onExportJson?: () => void
  readOnly?: boolean
  userAvatar?: string
  workflowName?: string
}
