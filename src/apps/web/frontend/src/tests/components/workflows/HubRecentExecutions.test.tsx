import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HubRecentExecutions from '$components/workflows/HubRecentExecutions'
import type { DashboardExecution, ExecutionStatus } from '$types/workflow'

const statuses: ExecutionStatus[] = ['running', 'pending', 'success', 'failed']
const executions: DashboardExecution[] = statuses.map((status, index) => ({
  id: index + 1,
  workflowId: `workflow-${index}`,
  workflowName: `Workflow ${status}`,
  status,
  startedAt: '2026-01-01T00:00:00Z',
}))

function iconFor(name: string) {
  const row = screen.getByText(name).parentElement
  return row?.querySelector('.material-symbols-outlined')?.textContent
}

describe('HubRecentExecutions', () => {
  it('exposes each status as text and draws running and pending differently', () => {
    render(
      <MemoryRouter>
        <HubRecentExecutions executions={executions} loading={false} />
      </MemoryRouter>
    )
    for (const label of ['Running', 'Pending', 'Success', 'Failed'])
      expect(screen.getByText(label)).toHaveClass('sr-only')
    expect(iconFor('Running')).toBe('progress_activity')
    expect(iconFor('Pending')).toBe('schedule')
  })
})
