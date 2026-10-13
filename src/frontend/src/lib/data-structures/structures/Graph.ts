import { GraphNode } from '../core/GraphNode'
import type { CanvasOptions, CanvasOutput } from '$types/data-structures'
import { graphToCanvasNodes } from '../adapters/graphAdapter'

/** Directed graph of valued nodes. */
export class Graph<T = unknown> {
  private nodes = new Map<string, GraphNode<T>>()

  addNode(value: T, id?: string, config?: Record<string, unknown>): GraphNode<T> {
    const node = new GraphNode(value, id, config)
    this.nodes.set(node.id, node)
    return node
  }

  getNode(id: string): GraphNode<T> | undefined {
    return this.nodes.get(id)
  }

  getNodes(): GraphNode<T>[] {
    return Array.from(this.nodes.values())
  }

  addEdge(fromId: string, toId: string): this {
    const fromNode = this.nodes.get(fromId)
    if (!fromNode || !this.nodes.has(toId)) {
      throw new Error('Both nodes must exist in the graph')
    }

    fromNode.edges.add(toId)
    return this
  }

  getEdges(): Array<{ from: string; to: string }> {
    return this.getNodes().flatMap(node => Array.from(node.edges, to => ({ from: node.id, to })))
  }

  hasCycle(): boolean {
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const hasCycleHelper = (nodeId: string): boolean => {
      visited.add(nodeId)
      recStack.add(nodeId)

      for (const neighborId of this.nodes.get(nodeId)!.edges) {
        if (!visited.has(neighborId)) {
          if (hasCycleHelper(neighborId)) return true
        } else if (recStack.has(neighborId)) {
          return true
        }
      }

      recStack.delete(nodeId)
      return false
    }

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId) && hasCycleHelper(nodeId)) return true
    }

    return false
  }

  toCanvasNodes(options?: CanvasOptions): CanvasOutput {
    return graphToCanvasNodes(this, options)
  }
}
