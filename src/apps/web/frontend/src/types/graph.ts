import type { ReactNode } from 'react'
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  EdgeTypes,
  NodeMouseHandler,
} from '@xyflow/react'
import type { ExecutionStatus } from './workflow'

export type FlowMode = 'edit' | 'execution'

export interface BaseNodeData extends Record<string, unknown> {
  label?: string
  mode?: FlowMode
  status?: ExecutionStatus
  duration?: number
  function_name?: string
  params?: Record<string, unknown>
  condition?: string
  merge_strategy?: string
  prompt?: string
  model?: string
  temperature?: number
}

export interface FlowEdgeData {
  mode?: FlowMode
  status?: ExecutionStatus
}

export interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  nodeTypes: NodeTypes
  edgeTypes?: EdgeTypes
  nodesDraggable?: boolean
  nodesConnectable?: boolean
  elementsSelectable?: boolean
  onNodesChange?: OnNodesChange
  onEdgesChange?: OnEdgesChange
  onConnect?: OnConnect
  onNodeClick?: NodeMouseHandler
  onPaneClick?: (event: React.MouseEvent) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDragOver?: (event: React.DragEvent) => void
  onDrop?: (event: React.DragEvent) => void
  showMiniMap?: boolean
  fitView?: boolean
  zoomOnScroll?: boolean
  panOnScroll?: boolean
  className?: string
  children?: ReactNode
}
