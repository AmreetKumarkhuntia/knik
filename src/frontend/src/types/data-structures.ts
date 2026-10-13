import type { Node, Edge } from '@xyflow/react'
import type { ExecutionStatus } from './workflow'

export interface DagLayoutOptions {
  width: number
  height: number
  direction?: 'horizontal' | 'vertical'
  nodeSpacingX?: number
  nodeSpacingY?: number
}

/** Options for the canvas graph renderer. */
export interface CanvasOptions extends Partial<DagLayoutOptions> {
  nodeType?: string
  edgeType?: string
}

/** Output of a canvas rendering pass containing ReactFlow nodes and edges. */
export interface CanvasOutput {
  nodes: Node[]
  edges: Edge[]
}

/** Execution-related data attached to a workflow node. */
export interface ExecutionNodeData {
  status?: ExecutionStatus
  duration?: number
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  error_message?: string
}

/** Options for rendering a workflow graph. */
export interface WorkflowGraphOptions {
  mode?: 'edit' | 'execution'
  executionData?: Map<string, ExecutionNodeData>
}
