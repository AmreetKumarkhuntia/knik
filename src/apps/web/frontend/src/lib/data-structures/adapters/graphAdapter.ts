import type { Node, Edge } from '@xyflow/react'
import type { Graph } from '../structures/Graph'
import type { CanvasOptions, CanvasOutput } from '../types'
import {
  calculateForceLayout,
  calculateGridLayout,
  calculateCircularLayout,
  calculateDagLayout,
} from '../layout/GraphLayout'

export function graphToCanvasNodes<T>(graph: Graph<T>, options: CanvasOptions = {}): CanvasOutput {
  const {
    layout = 'force',
    width = 800,
    height = 600,
    nodeType = 'default',
    edgeType = 'default',
    nodeConfig,
    edgeConfig,
    forceStrength,
    linkDistance,
  } = options

  const graphNodes = graph.getNodes()
  const graphEdges = graph.getEdges()

  const nodeIds = graphNodes.map(n => ({ id: n.id }))
  const edgeLinks = graphEdges.map(e => ({ source: e.from, target: e.to }))

  let positions: Map<string, { x: number; y: number }>

  switch (layout) {
    case 'grid':
      positions = calculateGridLayout(nodeIds, { width, height })
      break
    case 'circular':
      positions = calculateCircularLayout(nodeIds, { width, height })
      break
    case 'dag':
      positions = calculateDagLayout(nodeIds, edgeLinks, { width, height })
      break
    case 'force':
    default:
      positions = calculateForceLayout(nodeIds, edgeLinks, {
        width,
        height,
        strength: forceStrength,
        linkDistance,
      })
      break
  }

  const nodes: Node[] = graphNodes.map(node => {
    const pos = positions.get(node.id) || { x: 0, y: 0 }
    const customConfig = nodeConfig ? nodeConfig(node) : {}

    const nodeData: Record<string, unknown> = {
      ...node.config,
      ...customConfig,
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
    const customConfig =
      edgeConfig && fromNode && toNode ? edgeConfig(fromNode, toNode, edge.weight) : {}

    const conditions = fromNode?.config.conditions as Record<string, string> | undefined
    const sourceHandle = conditions?.[edge.to]

    const edgeData: Record<string, unknown> = {
      weight: edge.weight,
      ...customConfig,
    }

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
