import type { ComponentProps } from 'react'
import type { Handle, NodeProps } from '@xyflow/react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BaseNode from '$components/graph/nodes/BaseNode'

vi.mock('@xyflow/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...actual,
    Handle: ({ id, position, type, style, children, ...props }: ComponentProps<typeof Handle>) => (
      <div
        data-handle-id={id}
        data-handle-position={position}
        data-handle-type={type}
        aria-label={props['aria-label']}
        style={style}
      >
        {children}
      </div>
    ),
  }
})

const nodeProps: NodeProps = {
  id: 'branch',
  data: { mode: 'execution', direction: 'horizontal', status: 'success', duration: 120 },
  type: 'ConditionalBranchNode',
  dragging: false,
  zIndex: 0,
  selectable: false,
  deletable: false,
  selected: false,
  draggable: false,
  isConnectable: false,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
}

describe('graph node responsive ports', () => {
  it('preserves branch handle IDs while rotating edge attachment points', () => {
    const { rerender } = render(<BaseNode {...nodeProps} />)
    const truePort = screen.getByLabelText('True output')
    const falsePort = screen.getByLabelText('False output')
    expect(truePort).toHaveAttribute('data-handle-id', 'true')
    expect(falsePort).toHaveAttribute('data-handle-id', 'false')
    expect(truePort).toHaveAttribute('data-handle-position', 'right')
    expect(truePort).toHaveStyle({ top: '30%' })
    expect(falsePort).toHaveStyle({ top: '70%' })

    rerender(<BaseNode {...nodeProps} data={{ ...nodeProps.data, direction: 'vertical' }} />)
    expect(screen.getByLabelText('True output')).toBe(truePort)
    expect(screen.getByLabelText('False output')).toBe(falsePort)
    expect(truePort).toHaveAttribute('data-handle-position', 'bottom')
    expect(falsePort).toHaveAttribute('data-handle-position', 'bottom')
    expect(truePort).toHaveStyle({ left: '30%' })
    expect(falsePort).toHaveStyle({ left: '70%' })
    expect(truePort.style.top).toBe('')
    expect(falsePort.style.top).toBe('')

    rerender(<BaseNode {...nodeProps} />)
    expect(truePort).toHaveAttribute('data-handle-position', 'right')
    expect(truePort).toHaveStyle({ top: '30%' })
    expect(truePort.style.left).toBe('')
  })

  it('keeps the AI prompt and response handles connected through orientation changes', () => {
    const props = { ...nodeProps, id: 'agent', type: 'AIExecutionNode' }
    const { rerender } = render(<BaseNode {...props} />)
    const input = screen.getByLabelText('Prompt input')
    const output = screen.getByLabelText('Response output')
    expect(input).toHaveAttribute('data-handle-id', 'input')
    expect(output).toHaveAttribute('data-handle-id', 'output')
    expect(input).toHaveAttribute('data-handle-position', 'left')
    expect(output).toHaveAttribute('data-handle-position', 'right')

    rerender(<BaseNode {...props} data={{ ...props.data, direction: 'vertical' }} />)
    expect(screen.getByLabelText('Prompt input')).toBe(input)
    expect(screen.getByLabelText('Response output')).toBe(output)
    expect(input).toHaveAttribute('data-handle-position', 'top')
    expect(output).toHaveAttribute('data-handle-position', 'bottom')
  })

  it('pulses only execution nodes that are running', () => {
    const { container, rerender } = render(
      <BaseNode {...nodeProps} data={{ ...nodeProps.data, status: 'running' }} />
    )
    expect(container.querySelector('.graph-node')).toHaveClass('graph-node--running')

    rerender(<BaseNode {...nodeProps} />)
    expect(container.querySelector('.graph-node')).not.toHaveClass('graph-node--running')
  })

  it('outlines finished execution nodes by outcome but leaves editable nodes plain', () => {
    const { container, rerender } = render(<BaseNode {...nodeProps} />)
    expect(container.querySelector('.graph-node')).toHaveClass('graph-node--success')

    rerender(<BaseNode {...nodeProps} data={{ ...nodeProps.data, status: 'failed' }} />)
    expect(container.querySelector('.graph-node')).toHaveClass('graph-node--failed')
    expect(container.querySelector('.graph-node')).not.toHaveClass('graph-node--success')

    rerender(<BaseNode {...nodeProps} data={{ mode: 'edit', status: 'failed' }} />)
    expect(container.querySelector('.graph-node')).not.toHaveClass('graph-node--failed')
  })

  it('keeps execution start and end pills to their title, with the outcome in the outline', () => {
    const { container } = render(
      <BaseNode
        {...nodeProps}
        id="start"
        type="StartNode"
        data={{ mode: 'execution', status: 'success', duration: 0 }}
      />
    )
    const node = container.querySelector('.graph-node')
    expect(node).toHaveClass('graph-node--terminal', 'graph-node--success')
    expect(container.querySelector('.graph-node__execution')).toBeNull()
    expect(screen.queryByText('success')).toBeNull()
  })

  it('fades editable nodes in without a scale, which would skew measured handle positions', () => {
    const { container } = render(<BaseNode {...nodeProps} data={{ mode: 'edit' }} />)
    const node = container.querySelector('.graph-node')
    expect(node).toHaveClass('knik-enter-fade')
    expect(node).not.toHaveClass('knik-enter-pop')
  })

  it('colours each branch label like the handle it names', () => {
    render(<BaseNode {...nodeProps} />)
    expect(screen.getByText('True')).toHaveStyle({ color: 'var(--success)' })
    expect(screen.getByText('False')).toHaveStyle({ color: 'var(--danger)' })
  })
})
