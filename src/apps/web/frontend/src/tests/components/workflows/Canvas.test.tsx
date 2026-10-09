import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Canvas from '$components/workflows/builder/Canvas'
import type { CanvasProps } from '$types/sections/workflow-builder'

vi.mock('$components/graph', async () => {
  const { ReactFlowProvider } = await import('@xyflow/react')
  return {
    BaseNode: () => null,
    FlowEdge: () => null,
    FlowCanvas: ({ children }: { children?: ReactNode }) => (
      <ReactFlowProvider>
        <div data-testid="flow-canvas">{children}</div>
      </ReactFlowProvider>
    ),
  }
})

const props = (): CanvasProps => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  error: 'Node summarize: prompt is required\nNode check: condition is required',
  onNodesChange: vi.fn(),
  onEdgesChange: vi.fn(),
  onConnect: vi.fn(),
  onSelectNode: vi.fn(),
  onNodeUpdate: vi.fn(),
  onAddNode: vi.fn(),
  modelOptions: [],
  fieldDrafts: {},
  onFieldDraftChange: vi.fn(),
})

describe('workflow builder canvas', () => {
  it('stacks the validation error above the canvas instead of over the Add Node trigger', () => {
    render(<Canvas {...props()} />)
    const error = screen.getByRole('alert')
    const canvas = screen.getByTestId('flow-canvas')
    expect(error).toHaveTextContent('Node summarize: prompt is required')
    expect(error.closest('.absolute')).toBeNull()
    expect(error.compareDocumentPosition(canvas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(canvas).toContainElement(screen.getByRole('button', { name: 'Add Node' }))
  })

  it('lets keyboard users focus and scroll a long validation error list', () => {
    render(<Canvas {...props()} />)
    const scroller = screen.getByRole('region', { name: 'Validation errors' })
    expect(scroller).toHaveClass('overflow-y-auto')
    expect(scroller).toContainElement(screen.getByRole('alert'))
    scroller.focus()
    expect(scroller).toHaveFocus()
  })

  it('takes its narrow layout from the narrow prop rather than reading the window', () => {
    const selectedNode = { id: 'start', type: 'StartNode', position: { x: 0, y: 0 }, data: {} }
    const view = render(<Canvas {...props()} selectedNode={selectedNode} />)
    expect(screen.getByRole('complementary', { name: 'Node properties' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    view.rerender(<Canvas {...props()} selectedNode={selectedNode} narrow />)
    expect(screen.getByRole('dialog', { name: 'Node properties' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Node properties' })).not.toBeInTheDocument()
  })
})
