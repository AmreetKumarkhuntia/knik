import type { Node, Edge } from '@xyflow/react'
import type { Graph } from '../structures/Graph'
import type { CanvasOptions, CanvasOutput } from '$types/data-structures'
import { calculateDagLayout } from '../layout/GraphLayout'

export function graphToCanvasNodes<T>(graph: Graph<T>, options: CanvasOptions = {}): CanvasOutput {
  const {
    width = 800,
    height = 600,
    nodeType = 'default',
    edgeType = 'default',
    direction,
    nodeSpacingX,
    nodeSpacingY,
  } = options

  const graphNodes = graph.getNodes()
  const graphEdges = graph.getEdges()

  const positions = calculateDagLayout(
    graphNodes,
    graphEdges.map(e => ({ source: e.from, target: e.to })),
    { width, height, direction, nodeSpacingX, nodeSpacingY }
  )

  const nodes: Node[] = graphNodes.map(node => {
    const pos = positions.get(node.id) || { x: 0, y: 0 }

    const nodeData: Record<string, unknown> = {
      ...node.config,
      label: node.config.label || `Node ${node.id}`,
    }

    const actualNodeType = node.config.type as string | undefined
    const finalNodeType = actualNodeType || nodeType

    return {
      id: node.id,
      type: finalNodeType,
      position: pos,
      data: nodeData,
    }
  })

  const edges: Edge[] = graphEdges.map((edge, index) => {
    const fromNode = graph.getNode(edge.from)
    const toNode = graph.getNode(edge.to)
    const conditions = fromNode?.config.conditions as Record<string, string> | undefined
    const sourceHandle = conditions?.[edge.to]

    const edgeData: Record<string, unknown> = {}

    if (fromNode?.config.mode) {
      edgeData.mode = fromNode.config.mode
    }

    if (fromNode?.config.status && toNode?.config.status) {
      const sourceStatus = fromNode.config.status as string
      const targetStatus = toNode.config.status as string

      let edgeStatus = 'pending'
      if (sourceStatus === 'failed' || targetStatus === 'failed') {
        edgeStatus = 'failed'
      } else if (sourceStatus === 'success' && targetStatus === 'success') {
        edgeStatus = 'success'
      } else if (sourceStatus === 'running' || targetStatus === 'running') {
        edgeStatus = 'running'
      }
      edgeData.status = edgeStatus
    }

    return {
      id: `e-${edge.from}-${edge.to}-${index}`,
      source: edge.from,
      target: edge.to,
      sourceHandle,
      type: edgeType,
      data: edgeData,
    }
  })

  return { nodes, edges }
}
