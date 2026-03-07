import type { WorkflowDefinition } from '$types/workflow'

export interface CanvasProps {
  workflowId?: string
  definition?: WorkflowDefinition
  onSave?: (definition: WorkflowDefinition) => void
  onExecute?: () => void
  readOnly?: boolean
}
