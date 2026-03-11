export class GraphNode<T = unknown> {
  readonly id: string
  value: T
  edges: Map<string, { node: GraphNode<T>; weight?: number }>
  config: Record<string, unknown>

  constructor(value: T, id?: string, config?: Record<string, unknown>) {
    this.id = id || `node_${Math.random().toString(36).slice(2, 11)}`
    this.value = value
    this.edges = new Map()
    this.config = config || {}
  }

  addEdge(target: GraphNode<T>, weight?: number): this {
    this.edges.set(target.id, { node: target, weight })
    return this
  }

  removeEdge(targetId: string): boolean {
    return this.edges.delete(targetId)
  }

  hasEdge(targetId: string): boolean {
    return this.edges.has(targetId)
  }

  getEdgeWeight(targetId: string): number | undefined {
    return this.edges.get(targetId)?.weight
  }

  getNeighbors(): GraphNode<T>[] {
    return Array.from(this.edges.values()).map(edge => edge.node)
  }

  degree(): number {
    return this.edges.size
  }

  outDegree(): number {
    return this.edges.size
  }

  inDegree(allNodes: GraphNode<T>[]): number {
    let count = 0
    for (const node of allNodes) {
      if (node.hasEdge(this.id)) {
        count++
      }
    }
    return count
  }
}
