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
    if (node.type === 'AIExecutionNode') data.prompt = data.systemPrompt ?? data.prompt ?? ''
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
export function selectWorkflow(state: WorkflowStore, id?: string) {
  return state.workflows.find(workflow => workflow.id === id)
}
