import type { Node } from '@xyflow/react'

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
