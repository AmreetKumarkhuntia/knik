import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExecutionFlowGraph from '$components/product/ExecutionFlowGraph'
import type { WorkflowDefinition } from '$types/workflow'

const mountedDirections: string[] = []

vi.mock('$components/graph', () => ({
  BaseNode: () => null,
  FlowEdge: () => null,
  FlowCanvas: function FlowCanvasProbe({ nodes }: { nodes: { data: { direction: string } }[] }) {
    mountedDirections.push(nodes[0]?.data.direction ?? '')
    return null
  },
}))

const definition: WorkflowDefinition = {
  nodes: { start: { type: 'StartNode' }, end: { type: 'EndNode' } },
  connections: [{ from_id: 'start', to_id: 'end' }],
}

beforeEach(() => {
  mountedDirections.length = 0
  // An observer that never reports: only the synchronous measurement can pick the direction.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('execution flow graph layout', () => {
  it('measures a narrow container before the first paint and lays out top to bottom', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 600,
    } as DOMRect)
    const { container } = render(<ExecutionFlowGraph definition={definition} timeline={[]} />)
    expect(container.querySelector('[data-flow-direction]')).toHaveAttribute(
      'data-flow-direction',
      'vertical'
    )
    expect(mountedDirections.at(-1)).toBe('vertical')
  })

  it('keeps the horizontal default when the container has not been laid out', () => {
    const { container } = render(<ExecutionFlowGraph definition={definition} timeline={[]} />)
    expect(container.querySelector('[data-flow-direction]')).toHaveAttribute(
      'data-flow-direction',
      'horizontal'
    )
  })
})
