import { render, screen } from '@testing-library/react'
import { Position, type Edge, type Node, type NodeTypes } from '@xyflow/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { BaseNode, FlowCanvas } from '$components/graph'

const nodeTypes: NodeTypes = {
  StartNode: BaseNode,
  AIExecutionNode: BaseNode,
  ConditionalBranchNode: BaseNode,
}

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('flow canvas accessibility', () => {
  it('names each node from its title, type and execution status', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'StartNode', position: { x: 0, y: 0 }, data: { mode: 'edit' } },
      {
        id: 'summarize',
        type: 'AIExecutionNode',
        position: { x: 300, y: 0 },
        data: { label: 'Summarize', mode: 'execution', status: 'success' },
      },
      {
        id: 'custom',
        type: 'StartNode',
        position: { x: 600, y: 0 },
        ariaLabel: 'Supplied name',
        data: { mode: 'edit' },
      },
    ]
    const { container } = render(
      <div style={{ width: 900, height: 500 }}>
        <FlowCanvas nodes={nodes} edges={[]} nodeTypes={nodeTypes} fitView={false} />
      </div>
    )
    // jsdom never measures nodes, so xyflow keeps them visibility-hidden and out of role queries.
    const names = Array.from(container.querySelectorAll('.react-flow__node'), node => [
      node.getAttribute('data-id'),
      node.getAttribute('role'),
      node.getAttribute('aria-label'),
    ])
    expect(names).toEqual([
      ['start', 'group', 'Start, Entry point'],
      ['summarize', 'group', 'Summarize, AI model, success'],
      ['custom', 'group', 'Supplied name'],
    ])
    expect(nodes.every(node => node.id === 'custom' || node.ariaLabel === undefined)).toBe(true)
  })

  it('names each edge by the titles of the nodes it joins rather than their ids', () => {
    // jsdom never measures handles, so supply their bounds the way xyflow's SSR mode expects.
    const sized = (node: Node): Node => ({
      ...node,
      width: 200,
      height: 80,
      handles: [
        { type: 'target', position: Position.Left, x: 0, y: 40, width: 8, height: 8 },
        {
          id: 'true',
          type: 'source',
          position: Position.Right,
          x: 192,
          y: 20,
          width: 8,
          height: 8,
        },
        { type: 'source', position: Position.Right, x: 192, y: 40, width: 8, height: 8 },
      ],
    })
    const nodes = [
      { id: 'n-1', type: 'StartNode', position: { x: 0, y: 0 }, data: { mode: 'edit' } },
      {
        id: 'n-2',
        type: 'ConditionalBranchNode',
        position: { x: 300, y: 0 },
        data: { label: 'Check', mode: 'edit' },
      },
      {
        id: 'n-3',
        type: 'AIExecutionNode',
        position: { x: 600, y: 0 },
        data: { label: 'Summarize', mode: 'edit' },
      },
    ].map(sized)
    const edges: Edge[] = [
      { id: 'a', source: 'n-1', target: 'n-2' },
      { id: 'b', source: 'n-2', sourceHandle: 'true', target: 'n-3' },
    ]
    const { container } = render(
      <div style={{ width: 900, height: 500 }}>
        <FlowCanvas nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView={false} />
      </div>
    )
    const names = Array.from(container.querySelectorAll('.react-flow__edge'), edge =>
      edge.getAttribute('aria-label')
    )
    expect(names).toEqual([
      'Connection from Start to Check',
      'Connection from Check (True) to Summarize',
    ])
    expect(edges.every(edge => edge.ariaLabel === undefined)).toBe(true)
  })

  it('exposes the zoom readout as a named status', () => {
    render(<FlowCanvas nodes={[]} edges={[]} nodeTypes={nodeTypes} />)
    expect(screen.getByRole('status', { name: 'Zoom level' })).toHaveTextContent('100%')
  })
})
