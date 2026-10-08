import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react'

export interface BuilderFieldStateProps {
  modelOptions: Array<{ value: string; label: string }>
  fieldDrafts: Record<string, string>
  onFieldDraftChange: (field: string, value: string) => void
}
export interface CanvasProps extends BuilderFieldStateProps {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  error: string | null
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onSelectNode: (id: string | null) => void
  onNodeUpdate: (id: string, data: Record<string, unknown>) => void
  onAddNode: (type: string, position: { x: number; y: number }) => void
  onSave?: () => void
  onExecute?: () => void
  readOnly?: boolean
  workflowName?: string
  onNameChange?: (name: string) => void
  onBack?: () => void
  canRun?: boolean
  onExportJson?: () => void
}

/** Props for the node properties sidebar panel. */
export interface NodePropertiesProps extends BuilderFieldStateProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
}

/** Props for the node configuration form. */
export interface ConfigurationFormProps extends BuilderFieldStateProps {
  nodeId: string
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
  onNameChange?: (name: string) => void
  onBack?: () => void
  canRun?: boolean
}

/** Props for the floating canvas controls (node palette launcher). */
export interface FloatingControlsProps {
  onAddNode?: (type: string, position: { x: number; y: number }) => void
}

/** Props for the node properties side panel. */
export interface NodePropertiesPanelProps extends BuilderFieldStateProps {
  compact?: boolean
  onClose: () => void
  selectedNode: Node | null
  onNodeUpdate: (nodeId: string, data: Record<string, unknown>) => void
}

/** A single line in the builder run-bar log stream. */
export interface RunLog {
  t: string
  m: string
  c: string
}

/** Props for the floating workflow run-bar. */
export interface RunBarProps {
  onClose?: () => void
}

export interface WorkflowBuilderWidgetProps {
  workflowId?: string
}
export interface ExecutionDetailWidgetProps {
  executionId?: string
}
