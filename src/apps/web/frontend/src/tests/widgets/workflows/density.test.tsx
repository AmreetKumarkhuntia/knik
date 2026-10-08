import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StoresProvider } from '$stores'
import WorkflowHubWidget from '$widgets/workflows/WorkflowHubWidget'
import AllExecutionsWidget from '$widgets/workflows/AllExecutionsWidget'
import SchedulesWidget from '$widgets/schedules/SchedulesWidget'

describe('compact application tables', () => {
  it('uses consistent compact headers across workflows, executions, and schedules', () => {
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
            schedules: [
              {
                id: 1,
                target_workflow_id: 'one',
                schedule_description: 'Daily',
                enabled: true,
                timezone: 'UTC',
              },
            ],
          }}
        >
          <WorkflowHubWidget />
          <AllExecutionsWidget />
          <SchedulesWidget />
        </StoresProvider>
      </MemoryRouter>
    )
    const headers = screen.getAllByRole('columnheader', { name: 'Workflow' })
    expect(headers).toHaveLength(3)
    for (const header of headers) expect(header).toHaveClass('py-2')
  })
})
