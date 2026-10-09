import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { StoresProvider } from '$stores'
import { useWorkflowStore } from '$stores/workflows'
import ExecutionDetailWidget from '$widgets/workflows/ExecutionDetailWidget'
import type { ExecutionFlowGraphProps } from '$types/components'

vi.mock('$components/product/ExecutionFlowGraph', () => ({
  default: ({ definition }: ExecutionFlowGraphProps) => (
    <output aria-label="Execution graph nodes">
      {Object.keys(definition?.nodes ?? {}).join(', ')}
    </output>
  ),
}))

function ExecutionRoute() {
  const { id } = useParams()
  return <ExecutionDetailWidget executionId={id} />
}

function DigestEditor() {
  const store = useWorkflowStore(state => state)
  const saved = store.workflows.find(workflow => workflow.id === 'wf-1')
  const removeSummarize = () => {
    store.initBuilder('editor', 'wf-1')
    store.changeNodes('editor', [{ type: 'remove', id: 'summarize' }])
    store.changeEdges('editor', [
      { type: 'remove', id: 'edge-1-prepare-summarize' },
      { type: 'remove', id: 'edge-2-summarize-end' },
    ])
    store.connect('editor', {
      source: 'prepare',
      target: 'end',
      sourceHandle: null,
      targetHandle: null,
    })
    store.saveBuilder('editor')
  }
  return (
    <>
      <button onClick={removeSummarize}>Remove summarize step</button>
      <output aria-label="Saved workflow nodes">
        {Object.keys(saved?.definition.nodes ?? {}).join(', ')}
      </output>
    </>
  )
}

describe('execution detail workspace', () => {
  it('opens outputs, handles keyboard tabs and collapse, and resets route-local views', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/executions/1']}>
        <StoresProvider
          source={{
            workflows: [
              { id: 'workflow', name: 'Digest', definition: { nodes: {}, connections: [] } },
            ],
            executions: [1, 2].map(id => ({
              id,
              workflow_id: 'workflow',
              workflow_name: 'Digest',
              status: 'success' as const,
              started_at: '2026-10-08T12:00:00Z',
              inputs: { source: 'inbox' },
              outputs: { summary: `Supplied output ${id}` },
            })),
          }}
        >
          <Link to="/executions/1">First execution</Link>
          <Link to="/executions/2">Second execution</Link>
          <Routes>
            <Route path="/executions/:id" element={<ExecutionRoute />} />
          </Routes>
        </StoresProvider>
      </MemoryRouter>
    )
    expect(screen.getByRole('tab', { name: 'Outputs' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Supplied output 1')
    await user.click(screen.getByRole('tab', { name: 'Inputs' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('inbox')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('No execution steps available')
    await user.click(screen.getByRole('button', { name: 'Collapse execution details' }))
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Inputs' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('inbox')
    await user.click(screen.getByRole('link', { name: 'Second execution' }))
    expect(screen.getByRole('tab', { name: 'Outputs' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Supplied output 2')
    await user.click(screen.getByRole('link', { name: 'First execution' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Supplied output 1')
    expect(screen.getByRole('button', { name: 'Collapse execution details' })).toBeInTheDocument()
  })

  it('keeps drawing the definition an execution ran after its workflow is edited', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider>
          <DigestEditor />
          <ExecutionDetailWidget executionId="9210" />
        </StoresProvider>
      </MemoryRouter>
    )
    const graph = screen.getByRole('status', { name: 'Execution graph nodes' })
    expect(screen.getByRole('region', { name: 'Execution flow' })).toContainElement(graph)
    expect(graph).toHaveTextContent('start, prepare, summarize, end')
    await user.click(screen.getByRole('button', { name: 'Remove summarize step' }))
    expect(screen.getByRole('status', { name: 'Saved workflow nodes' })).toHaveTextContent(
      /^start, prepare, end$/
    )
    expect(graph).toHaveTextContent('start, prepare, summarize, end')
  })

  it('hides timeline icon ligatures from assistive technology', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider>
          <ExecutionDetailWidget executionId="9210" />
        </StoresProvider>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('tab', { name: 'Timeline' }))
    const panel = screen.getByRole('tabpanel')
    expect(screen.getByRole('heading', { level: 2, name: 'summarize' })).toBeInTheDocument()
    const icons = panel.querySelectorAll('.material-symbols-outlined')
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})
