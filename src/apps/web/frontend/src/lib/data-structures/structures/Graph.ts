import { GraphNode } from '../core/GraphNode'
import type {
  GraphOptions,
  CanvasOptions,
  CanvasOutput,
  ShortestPathResult,
} from '$types/data-structures'
import { graphToCanvasNodes } from '../adapters/graphAdapter'

export class Graph<T = unknown> {
  private nodes: Map<string, GraphNode<T>>
  readonly directed: boolean
  readonly weighted: boolean

  constructor(options: GraphOptions = {}) {
    this.nodes = new Map()
    this.directed = options.directed ?? true
    this.weighted = options.weighted ?? false
  }

  addNode(value: T, id?: string, config?: Record<string, unknown>): GraphNode<T> {
    const node = new GraphNode(value, id, config)
    this.nodes.set(node.id, node)
    return node
  }

  removeNode(id: string): boolean {
    const node = this.nodes.get(id)
    if (!node) return false

    this.nodes.forEach(n => n.removeEdge(id))
    return this.nodes.delete(id)
  }

  getNode(id: string): GraphNode<T> | undefined {
    return this.nodes.get(id)
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id)
  }

  getNodes(): GraphNode<T>[] {
    return Array.from(this.nodes.values())
  }

  addEdge(fromId: string, toId: string, weight?: number): this {
    const fromNode = this.nodes.get(fromId)
    const toNode = this.nodes.get(toId)

    if (!fromNode || !toNode) {
      throw new Error('Both nodes must exist in the graph')
    }

    fromNode.addEdge(toNode, weight)

    if (!this.directed) {
      toNode.addEdge(fromNode, weight)
    }

    return this
  }

  removeEdge(fromId: string, toId: string): boolean {
    const fromNode = this.nodes.get(fromId)
    if (!fromNode) return false

    const removed = fromNode.removeEdge(toId)

    if (!this.directed) {
      const toNode = this.nodes.get(toId)
      toNode?.removeEdge(fromId)
    }

    return removed
  }

  hasEdge(fromId: string, toId: string): boolean {
    return this.nodes.get(fromId)?.hasEdge(toId) ?? false
  }

  getEdges(): Array<{ from: string; to: string; weight?: number }> {
    const edges: Array<{ from: string; to: string; weight?: number }> = []

    this.nodes.forEach(node => {
      node.edges.forEach((edge, targetId) => {
        edges.push({
          from: node.id,
          to: targetId,
          weight: edge.weight,
        })
      })
    })

    return edges
  }

  dfs(startId: string, callback?: (node: GraphNode<T>) => void): GraphNode<T>[] {
    const startNode = this.nodes.get(startId)
    if (!startNode) return []

    const visited = new Set<string>()
    const result: GraphNode<T>[] = []

    const dfsHelper = (node: GraphNode<T>) => {
      visited.add(node.id)
      result.push(node)
      callback?.(node)

      node.getNeighbors().forEach(neighbor => {
        if (!visited.has(neighbor.id)) {
          dfsHelper(neighbor)
        }
      })
    }

    dfsHelper(startNode)
    return result
  }

  bfs(startId: string, callback?: (node: GraphNode<T>) => void): GraphNode<T>[] {
    const startNode = this.nodes.get(startId)
    if (!startNode) return []

    const visited = new Set<string>()
    const queue: GraphNode<T>[] = [startNode]
    const result: GraphNode<T>[] = []

    visited.add(startNode.id)

    while (queue.length > 0) {
      const node = queue.shift()!
      result.push(node)
      callback?.(node)

      node.getNeighbors().forEach(neighbor => {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id)
          queue.push(neighbor)
        }
      })
    }

    return result
  }

  dijkstra(startId: string): Map<string, { distance: number; path: string[] }> {
    const distances = new Map<string, number>()
    const previous = new Map<string, string | null>()
    const unvisited = new Set<string>()

    this.nodes.forEach((_, id) => {
      distances.set(id, id === startId ? 0 : Infinity)
      previous.set(id, null)
      unvisited.add(id)
    })

    while (unvisited.size > 0) {
      let currentId: string | undefined
      let minDistance = Infinity

      unvisited.forEach(id => {
        const dist = distances.get(id)!
        if (dist < minDistance) {
          minDistance = dist
          currentId = id
        }
      })

      if (!currentId || minDistance === Infinity) break

      unvisited.delete(currentId)
      const currentNode = this.nodes.get(currentId)!

      currentNode.edges.forEach((edge, neighborId) => {
        const alt = distances.get(currentId!)! + (edge.weight ?? 1)
        if (alt < distances.get(neighborId)!) {
          distances.set(neighborId, alt)
          previous.set(neighborId, currentId!)
        }
      })
    }

    const result = new Map<string, { distance: number; path: string[] }>()

    this.nodes.forEach((_, id) => {
      const path: string[] = []
      let current: string | null = id

      while (current !== null) {
        path.unshift(current)
        const next = previous.get(current)
        current = next !== undefined ? next : null
      }

      result.set(id, {
        distance: distances.get(id)!,
        path: path[0] === startId ? path : [],
      })
    })

    return result
  }

  shortestPath(startId: string, endId: string): ShortestPathResult | null {
    const dijkstraResult = this.dijkstra(startId)
    const result = dijkstraResult.get(endId)

    if (!result || result.path.length === 0) return null

    return {
      path: result.path,
      distance: result.distance,
    }
  }

  hasCycle(): boolean {
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const hasCycleHelper = (nodeId: string): boolean => {
      visited.add(nodeId)
      recStack.add(nodeId)

      const node = this.nodes.get(nodeId)!
      for (const [neighborId] of node.edges) {
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
      if (!visited.has(nodeId)) {
        if (hasCycleHelper(nodeId)) return true
      }
    }

    return false
  }

  topologicalSort(): GraphNode<T>[] | null {
    if (!this.directed) {
      throw new Error('Topological sort only works on directed graphs')
    }

    if (this.hasCycle()) return null

    const visited = new Set<string>()
    const stack: GraphNode<T>[] = []

    const topSortHelper = (nodeId: string): void => {
      visited.add(nodeId)
      const node = this.nodes.get(nodeId)!

      node.edges.forEach((_, neighborId) => {
        if (!visited.has(neighborId)) {
          topSortHelper(neighborId)
        }
      })

      stack.unshift(node)
    }

    this.nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        topSortHelper(nodeId)
      }
    })

    return stack
  }

  isConnected(): boolean {
    if (this.nodes.size === 0) return true

    const startId = this.nodes.keys().next().value as string
    const visited = this.dfs(startId)

    return visited.length === this.nodes.size
  }

  toCanvasNodes(options?: CanvasOptions): CanvasOutput {
    return graphToCanvasNodes(this, options)
  }
}
