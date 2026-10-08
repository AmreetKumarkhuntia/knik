import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { StoresProvider } from '$stores'
import ExecutionDetailWidget from '$widgets/workflows/ExecutionDetailWidget'

vi.mock('$components/product/ExecutionFlowGraph', () => ({
  default: () => <div>Execution graph</div>,
}))

function ExecutionRoute() {
  const { id } = useParams()
  return <ExecutionDetailWidget executionId={id} />
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
})
