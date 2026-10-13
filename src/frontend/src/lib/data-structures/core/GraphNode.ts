/** Graph node holding a value and the ids of its outgoing edge targets. */
export class GraphNode<T = unknown> {
  readonly id: string
  value: T
  edges: Set<string>
  config: Record<string, unknown>

  constructor(value: T, id?: string, config?: Record<string, unknown>) {
    this.id = id || `node_${Math.random().toString(36).slice(2, 11)}`
    this.value = value
    this.edges = new Set()
    this.config = config || {}
  }
}
