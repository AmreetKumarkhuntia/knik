import type { Node, Edge } from '@xyflow/react'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'

// Re-export from $types/workflow to avoid duplication
export type { ExecutionStatus } from './workflow'

// ─── Graph core types ────────────────────────────────────────────────────────

export interface GraphOptions {
  directed?: boolean
  weighted?: boolean
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

// ─── Layout types ─────────────────────────────────────────────────────────────

export interface LayoutOptions {
  width: number
  height: number
  strength?: number
  linkDistance?: number
}

/** Internal d3-force simulation node — used by GraphLayout. */
export interface SimNode extends SimulationNodeDatum {
  id: string
}

/** Internal d3-force simulation link — used by GraphLayout. */
export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string
  target: string
}

// ─── Canvas types ─────────────────────────────────────────────────────────────

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

// ─── Workflow graph types ─────────────────────────────────────────────────────

export interface ExecutionNodeData {
  status?: import('./workflow').ExecutionStatus
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
