import type { Node, Edge } from '@xyflow/react'
import { Graph } from '../structures/Graph'

// Only branch outputs are conditions; other handle ids (e.g. an AI node's 'output') only pick a port.
const BRANCH_CONDITIONS = new Set(['true', 'false'])

export function canvasNodesToGraph<T = unknown>(nodes: Node[], edges: Edge[]): Graph<T> {
  const graph = new Graph<T>({ directed: true, weighted: false })
  const branchNodeIds = new Set(
    nodes.filter(node => node.type === 'ConditionalBranchNode').map(node => node.id)
  )

  nodes.forEach(node => {
    const value = node.data as T
    const config = { ...node.data }

    graph.addNode(value, node.id, config)
  })

  edges.forEach(edge => {
    const sourceId = edge.source
    const targetId = edge.target

    const weight = edge.data?.weight as number | undefined
    graph.addEdge(sourceId, targetId, weight)

    if (
      edge.sourceHandle &&
      branchNodeIds.has(sourceId) &&
      BRANCH_CONDITIONS.has(edge.sourceHandle)
    ) {
      const sourceNode = graph.getNode(sourceId)
      if (sourceNode) {
        if (!sourceNode.config.conditions) {
          sourceNode.config.conditions = {}
        }
        ;(sourceNode.config.conditions as Record<string, string>)[targetId] = edge.sourceHandle
      }
    }
  })

  return graph
}
