import type { Node, Edge } from '@xyflow/react'
import type { WorkflowDefinition } from '$types/workflow'
import type { WorkflowStore } from '$types/stores/workflows'

export function definitionToCanvas(definition?: WorkflowDefinition): {
  nodes: Node[]
  edges: Edge[]
} {
  const source = definition ?? {
    nodes: { start: { type: 'StartNode', label: 'Start' }, end: { type: 'EndNode', label: 'End' } },
    connections: [],
  }
  return {
    nodes: Object.entries(source.nodes).map(([id, data], index) => ({
      id,
      type: data.type,
      position: { x: 100 + index * 280, y: 200 },
      data: { ...structuredClone(data), mode: 'edit' },
    })),
    edges: source.connections.map((connection, index) => ({
      id: `edge-${index}-${connection.from_id}-${connection.to_id}`,
      source: connection.from_id,
      target: connection.to_id,
      sourceHandle: connection.condition,
      type: 'custom',
      data: { mode: 'edit' },
    })),
  }
}
export function normalizeNodes(nodes: Node[]): Node[] {
  return nodes.map(node => {
    const data: Record<string, unknown> = { ...node.data, type: node.type }
    delete data.mode
    if (node.type === 'AIExecutionNode') {
      data.prompt = data.systemPrompt ?? data.prompt ?? ''
      // systemPrompt is the editor's field name; the workflow contract only defines prompt.
      delete data.systemPrompt
    }
    if (node.type === 'FunctionExecutionNode' && typeof data.params === 'string') {
      try {
        const params: unknown = JSON.parse(data.params || '{}')
        if (!params || typeof params !== 'object' || Array.isArray(params))
          throw new Error('not an object')
        data.params = params
      } catch {
        throw new Error(`Node ${node.id}: Parameters must be a valid JSON object.`)
      }
    }
    return { ...node, data }
  })
}
// A definition keeps one connection per node pair, so a second one would be dropped on save.
export function duplicateConnectionError({ source, target }: Pick<Edge, 'source' | 'target'>) {
  return `Node ${source}: only one connection to ${target} is allowed.`
}
export function duplicateConnectionErrors(edges: Edge[]) {
  return edges
    .filter(
      (edge, index) =>
        edges.findIndex(other => other.source === edge.source && other.target === edge.target) !==
        index
    )
    .map(duplicateConnectionError)
}
/** Moving, resizing or selecting a node keeps its data object, so none of them alter the definition. */
export function sameDefinitionNodes(a?: Node[], b?: Node[]) {
  return (
    a === b ||
    (!!a &&
      !!b &&
      a.length === b.length &&
      a.every(
        (node, index) =>
          node.id === b[index].id && node.type === b[index].type && node.data === b[index].data
      ))
  )
}
export function selectWorkflow(state: WorkflowStore, id?: string) {
  return state.workflows.find(workflow => workflow.id === id)
}
