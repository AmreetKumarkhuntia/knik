import type { Node, Edge } from '@xyflow/react'
import type { ExecutionStatus } from '$types/workflow'

export type { ExecutionStatus }

export interface GraphOptions {
  directed?: boolean
  weighted?: boolean
}

export interface LayoutOptions {
  width: number
  height: number
  strength?: number
  linkDistance?: number
}

export interface CanvasOptions {
  layout?: 'force' | 'grid' | 'circular' | 'dag'
  width?: number
  height?: number
  nodeType?: string
  edgeType?: string
  nodeConfig?: <T>(node: GraphNodeType<T>) => Record<string, unknown>
  edgeConfig?: <T>(
    from: GraphNodeType<T>,
    to: GraphNodeType<T>,
    weight?: number
  ) => Record<string, unknown>
  forceStrength?: number
  linkDistance?: number
}

export interface CanvasOutput {
  nodes: Node[]
  edges: Edge[]
}

export interface GraphNodeType<T> {
  readonly id: string
  value: T
  edges: Map<string, { node: GraphNodeType<T>; weight?: number }>
  config: Record<string, unknown>
}

export interface ShortestPathResult {
  path: string[]
  distance: number
}

export interface DijkstraResult {
  distance: number
  path: string[]
}

export interface ExecutionNodeData {
  status?: ExecutionStatus
  duration?: number
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  error_message?: string
}

export interface WorkflowGraphOptions {
  mode?: 'edit' | 'execution'
  executionData?: Map<string, ExecutionNodeData>
  layout?: 'force' | 'grid' | 'circular' | 'dag'
  width?: number
  height?: number
}
