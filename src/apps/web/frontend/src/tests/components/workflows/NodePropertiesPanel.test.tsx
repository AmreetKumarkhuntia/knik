import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NodePropertiesPanel from '$components/workflows/builder/NodePropertiesPanel/NodePropertiesPanel'
import type { NodePropertiesPanelProps } from '$types'

const node = {
  id: 'start',
  type: 'StartNode',
  position: { x: 0, y: 0 },
  data: { label: 'Edited start' },
}
const props = (): NodePropertiesPanelProps => ({
  selectedNode: node,
  onNodeUpdate: vi.fn(),
  onClose: vi.fn(),
  modelOptions: [],
  fieldDrafts: {},
  onFieldDraftChange: vi.fn(),
})

describe('node inspector', () => {
  it('only occupies space for a selected node, closing without changing its draft', async () => {
    const user = userEvent.setup()
    const actions = props()
    const { rerender } = render(<NodePropertiesPanel {...actions} selectedNode={null} />)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    rerender(<NodePropertiesPanel {...actions} />)
    expect(screen.getByRole('complementary', { name: 'Node properties' })).toHaveClass('w-80')
    expect(screen.getByLabelText('Label')).toHaveValue('Edited start')
    await user.click(screen.getByRole('button', { name: 'Close node properties' }))
    expect(actions.onClose).toHaveBeenCalledOnce()
    expect(actions.onNodeUpdate).not.toHaveBeenCalled()
  })
  it('uses a dismissible drawer on narrow screens and emits field changes', async () => {
    const user = userEvent.setup()
    const actions = props()
    render(<NodePropertiesPanel {...actions} compact />)
    expect(screen.getByRole('dialog', { name: 'Node properties' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Label'), '!')
    expect(actions.onNodeUpdate).toHaveBeenLastCalledWith('start', { label: 'Edited start!' })
    await user.keyboard('{Escape}')
    expect(actions.onClose).toHaveBeenCalledOnce()
  })
  it('connects the selected node from the keyboard, since node handles only follow the pointer', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn()
    const check = {
      id: 'check',
      type: 'ConditionalBranchNode',
      position: { x: 0, y: 0 },
      data: { label: 'Check' },
    }
    const end = { id: 'end', type: 'EndNode', position: { x: 0, y: 0 }, data: {} }
    render(
      <NodePropertiesPanel
        {...props()}
        selectedNode={check}
        nodes={[node, check, end]}
        onConnect={onConnect}
      />
    )
    const target = screen.getByLabelText('Connect to')
    expect(
      Array.from(target.querySelectorAll('option'), option => option.textContent).slice(1)
    ).toEqual(['True → End', 'False → End'])
    const connect = screen.getByRole('button', { name: 'Connect' })
    expect(connect).toBeDisabled()
    await user.selectOptions(target, 'False → End')
    await user.click(connect)
    expect(onConnect).toHaveBeenCalledWith({
      source: 'check',
      sourceHandle: 'false',
      target: 'end',
      targetHandle: null,
    })
  })
  it('offers no keyboard connection without a connect handler, as in read-only views', () => {
    render(<NodePropertiesPanel {...props()} nodes={[node]} />)
    expect(screen.queryByLabelText('Connect to')).not.toBeInTheDocument()
  })
})
