import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { StoresProvider } from '$stores'
import SchedulesWidget from '$widgets/schedules/SchedulesWidget'
import WorkflowHubWidget from '$widgets/workflows/WorkflowHubWidget'

const source = {
  workflows: [
    { id: 'workflow-one', name: 'Customer digest', definition: { nodes: {}, connections: [] } },
  ],
}

afterEach(cleanup)

describe('session schedule interactions', () => {
  it('cancels drafts, saves across widgets, and deletes only after confirmation', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider source={source}>
          <SchedulesWidget />
          <WorkflowHubWidget />
        </StoresProvider>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: 'New schedule' }))
    await user.selectOptions(screen.getByLabelText('Target Workflow'), 'workflow-one')
    await user.type(screen.getByLabelText('Schedule', { exact: true }), 'every day at 9am')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('No schedules yet')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'New schedule' }))
    expect((screen.getByLabelText('Schedule', { exact: true }) as HTMLInputElement).value).toBe('')
    await user.selectOptions(screen.getByLabelText('Target Workflow'), 'workflow-one')
    await user.type(screen.getByLabelText('Schedule', { exact: true }), 'every day at 9am')
    await user.click(screen.getByRole('button', { name: 'Save schedule' }))
    expect(screen.getByText('every day at 9am')).toBeTruthy()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(1)
    await user.click(screen.getByRole('button', { name: 'Delete schedule for Customer digest' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('every day at 9am')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Delete schedule for Customer digest' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete schedule' })
    )
    expect(screen.getByText('No schedules yet')).toBeTruthy()
    expect(source.workflows).toHaveLength(1)
  })

  it('retains invalid drafts and does not add a schedule', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider source={source}>
        <SchedulesWidget />
      </StoresProvider>
    )
    await user.click(screen.getByRole('button', { name: 'New schedule' }))
    await user.selectOptions(screen.getByLabelText('Target Workflow'), 'workflow-one')
    await user.type(screen.getByLabelText('Schedule', { exact: true }), 'every morning')
    await user.clear(screen.getByLabelText('Timezone'))
    await user.type(screen.getByLabelText('Timezone'), 'invalid/timezone')
    await user.click(screen.getByRole('button', { name: 'Save schedule' }))
    expect(screen.getByText('Enter a valid timezone, such as UTC or Asia/Kolkata.')).toBeTruthy()
    expect((screen.getByLabelText('Schedule', { exact: true }) as HTMLInputElement).value).toBe(
      'every morning'
    )
    expect(screen.getByText('No schedules yet')).toBeTruthy()
  })
})
