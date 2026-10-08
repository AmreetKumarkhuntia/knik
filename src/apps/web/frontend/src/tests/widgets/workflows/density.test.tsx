import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StoresProvider } from '$stores'
import AppearancePane from '$widgets/settings/AppearancePane'
import WorkflowHubWidget from '$widgets/workflows/WorkflowHubWidget'
import AllExecutionsWidget from '$widgets/workflows/AllExecutionsWidget'

describe('shared session density', () => {
  it('updates workflow and execution tables from the same appearance setting', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider
          source={{
            workflows: [
              { id: 'one', name: 'Supplied workflow', definition: { nodes: {}, connections: [] } },
            ],
            executions: [
              {
                id: 1,
                workflow_id: 'one',
                workflow_name: 'Supplied workflow',
                status: 'success',
                started_at: '2026-10-08T12:00:00Z',
                inputs: {},
                outputs: {},
              },
            ],
          }}
        >
          <AppearancePane />
          <WorkflowHubWidget />
          <AllExecutionsWidget />
        </StoresProvider>
      </MemoryRouter>
    )
    const headers = screen.getAllByRole('columnheader', { name: 'Workflow' })
    expect(headers).toHaveLength(2)
    for (const header of headers) expect(header).toHaveClass('py-4')
    await user.click(screen.getByRole('switch', { name: 'Compact density' }))
    for (const header of headers) {
      expect(header).toHaveClass('py-2')
      expect(header).not.toHaveClass('py-4')
    }
  })
})
