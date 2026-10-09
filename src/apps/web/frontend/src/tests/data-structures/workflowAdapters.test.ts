import { describe, expect, it } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import { canvasNodesToGraph, graphToWorkflowDefinition } from '$lib/data-structures'
import { definitionToCanvas, normalizeNodes } from '$stores/workflows/selectors'

const node = (id: string, type: string, data: Record<string, unknown> = {}): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { type, ...data, mode: 'edit' },
})
const edge = (source: string, target: string, sourceHandle?: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle,
})
const toDefinition = (nodes: Node[], edges: Edge[]) =>
  graphToWorkflowDefinition(canvasNodesToGraph(normalizeNodes(nodes), edges))
const ports = (edges: Edge[]) =>
  edges.map(({ source, target, sourceHandle }) => ({ source, target, sourceHandle }))

describe('canvas and definition round trips', () => {
  it('saves edges drawn from AI and function ports without a branch condition', () => {
    const nodes = [
      node('start', 'StartNode'),
      node('work', 'FunctionExecutionNode', { function_name: 'prepare' }),
      node('ai', 'AIExecutionNode', { prompt: 'Summarize' }),
      node('end', 'EndNode'),
    ]
    const definition = toDefinition(nodes, [
      edge('start', 'work'),
      edge('work', 'ai', 'true'),
      edge('ai', 'end', 'output'),
    ])
    expect(definition.connections.map(connection => connection.condition)).toEqual([
      undefined,
      undefined,
      undefined,
    ])
    const reopened = definitionToCanvas(definition)
    expect(ports(reopened.edges)).toEqual([
      { source: 'start', target: 'work', sourceHandle: undefined },
      { source: 'work', target: 'ai', sourceHandle: undefined },
      { source: 'ai', target: 'end', sourceHandle: undefined },
    ])
    expect(toDefinition(reopened.nodes, reopened.edges)).toEqual(definition)
  })

  it('keeps conditional true and false branches through canvas, definition and canvas', () => {
    const nodes = [
      node('check', 'ConditionalBranchNode', { condition: 'data.ok' }),
      node('accept', 'EndNode'),
      node('reject', 'EndNode'),
    ]
    const definition = toDefinition(nodes, [
      edge('check', 'accept', 'true'),
      edge('check', 'reject', 'false'),
    ])
    expect(definition.connections).toEqual([
      { from_id: 'check', to_id: 'accept', condition: 'true' },
      { from_id: 'check', to_id: 'reject', condition: 'false' },
    ])
    const reopened = definitionToCanvas(definition)
    expect(ports(reopened.edges)).toEqual([
      { source: 'check', target: 'accept', sourceHandle: 'true' },
      { source: 'check', target: 'reject', sourceHandle: 'false' },
    ])
    expect(toDefinition(reopened.nodes, reopened.edges)).toEqual(definition)
  })

  it('saves the edited prompt under the contract key only', () => {
    const definition = toDefinition(
      [node('ai', 'AIExecutionNode', { prompt: 'Original', systemPrompt: 'Edited' })],
      []
    )
    expect(definition.nodes.ai).toEqual({ type: 'AIExecutionNode', prompt: 'Edited' })
    expect(definitionToCanvas(definition).nodes[0].data).toEqual({
      type: 'AIExecutionNode',
      prompt: 'Edited',
      mode: 'edit',
    })
  })
})
