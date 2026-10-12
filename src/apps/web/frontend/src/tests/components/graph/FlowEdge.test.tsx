import { Position, type EdgeProps } from '@xyflow/react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowEdge } from '$components/graph'

const edgeProps = {
  id: 'a-b',
  source: 'a',
  target: 'b',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 0,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
} as EdgeProps

const renderEdge = (status?: 'running' | 'success' | 'failed' | 'pending') =>
  render(
    <svg>
      <FlowEdge {...edgeProps} data={{ mode: 'execution', status }} />
    </svg>
  ).container.querySelector('path.react-flow__edge-path')

describe('FlowEdge execution motion', () => {
  it('flows dashes only while the edge is running', () => {
    expect(renderEdge('running')).toHaveClass('graph-edge', 'graph-edge--running')
    expect(renderEdge('success')).not.toHaveClass('graph-edge--running')
  })

  it.each([
    ['failed', 'var(--danger)'],
    ['success', 'var(--success)'],
    ['running', 'var(--info)'],
    ['pending', 'var(--fg-4)'],
    [undefined, 'var(--fg-4)'],
  ] as const)('strokes a %s edge with %s', (status, stroke) => {
    expect(renderEdge(status)?.getAttribute('style')).toContain(`stroke: ${stroke}`)
  })
})
