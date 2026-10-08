import type { ComponentProps } from 'react'
import type { Handle, NodeProps } from '@xyflow/react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BaseNode from '$components/graph/nodes/BaseNode'

const { updateNodeInternals } = vi.hoisted(() => ({ updateNodeInternals: vi.fn() }))

vi.mock('@xyflow/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...actual,
    useUpdateNodeInternals: () => updateNodeInternals,
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
  it('preserves branch handle IDs while rotating and remeasuring edge attachment points', () => {
    const { rerender } = render(<BaseNode {...nodeProps} />)
    const truePort = screen.getByLabelText('True output')
    const falsePort = screen.getByLabelText('False output')
    expect(truePort).toHaveAttribute('data-handle-id', 'true')
    expect(falsePort).toHaveAttribute('data-handle-id', 'false')
    expect(truePort).toHaveAttribute('data-handle-position', 'right')
    expect(truePort).toHaveStyle({ top: '30%' })
    expect(falsePort).toHaveStyle({ top: '70%' })
    expect(updateNodeInternals).not.toHaveBeenCalled()
    updateNodeInternals.mockClear()

    rerender(<BaseNode {...nodeProps} data={{ ...nodeProps.data, direction: 'vertical' }} />)
    expect(screen.getByLabelText('True output')).toBe(truePort)
    expect(screen.getByLabelText('False output')).toBe(falsePort)
    expect(truePort).toHaveAttribute('data-handle-position', 'bottom')
    expect(falsePort).toHaveAttribute('data-handle-position', 'bottom')
    expect(truePort).toHaveStyle({ left: '30%' })
    expect(falsePort).toHaveStyle({ left: '70%' })
    expect(truePort.style.top).toBe('')
    expect(falsePort.style.top).toBe('')
    expect(updateNodeInternals).toHaveBeenCalledExactlyOnceWith('branch')
    updateNodeInternals.mockClear()

    rerender(<BaseNode {...nodeProps} />)
    expect(truePort).toHaveAttribute('data-handle-position', 'right')
    expect(truePort).toHaveStyle({ top: '30%' })
    expect(truePort.style.left).toBe('')
    expect(updateNodeInternals).toHaveBeenCalledExactlyOnceWith('branch')
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
    updateNodeInternals.mockClear()

    rerender(<BaseNode {...props} data={{ ...props.data, direction: 'vertical' }} />)
    expect(screen.getByLabelText('Prompt input')).toBe(input)
    expect(screen.getByLabelText('Response output')).toBe(output)
    expect(input).toHaveAttribute('data-handle-position', 'top')
    expect(output).toHaveAttribute('data-handle-position', 'bottom')
    expect(updateNodeInternals).toHaveBeenCalledExactlyOnceWith('agent')
  })
})
