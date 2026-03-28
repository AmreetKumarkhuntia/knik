/** Graph node holding a value and its outgoing edges. */
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

  /** Adds a directed edge to the target node with optional weight. */
  addEdge(target: GraphNode<T>, weight?: number): this {
    this.edges.set(target.id, { node: target, weight })
    return this
  }

  /** Removes the edge to the given target node. */
  removeEdge(targetId: string): boolean {
    return this.edges.delete(targetId)
  }

  /** Returns true if an edge to the target exists. */
  hasEdge(targetId: string): boolean {
    return this.edges.has(targetId)
  }

  /** Returns the weight of the edge to the target, or undefined. */
  getEdgeWeight(targetId: string): number | undefined {
    return this.edges.get(targetId)?.weight
  }

  /** Returns all neighbor nodes connected by outgoing edges. */
  getNeighbors(): GraphNode<T>[] {
    return Array.from(this.edges.values()).map(edge => edge.node)
  }

  /** Returns the total number of outgoing edges. */
  degree(): number {
    return this.edges.size
  }

  /** Alias for degree — number of outgoing edges. */
  outDegree(): number {
    return this.edges.size
  }

  /** Counts incoming edges from the given set of all nodes. */
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
