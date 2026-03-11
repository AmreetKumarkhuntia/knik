import type { Node, Edge } from '@xyflow/react'
import { Graph } from '../structures/Graph'

export function canvasNodesToGraph<T = unknown>(nodes: Node[], edges: Edge[]): Graph<T> {
  const graph = new Graph<T>({ directed: true, weighted: false })

  nodes.forEach(node => {
    const value = node.data as T
    const config = { ...node.data }

    graph.addNode(value, node.id, config)
  })

  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target

    const weight = edge.data?.weight as number | undefined
    graph.addEdge(sourceId, targetId, weight)

    if (edge.sourceHandle) {
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
