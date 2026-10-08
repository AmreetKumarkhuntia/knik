import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ScheduleListPanel from '$components/schedules/ScheduleListPanel'
import type { Schedule } from '$types/workflow'

const schedules: Schedule[] = [
  {
    id: 1,
    target_workflow_id: 'first',
    schedule_description: 'Daily',
    enabled: true,
    timezone: 'UTC',
  },
  {
    id: 2,
    target_workflow_id: 'second',
    schedule_description: 'Weekly',
    enabled: false,
    timezone: 'Asia/Kolkata',
  },
]

describe('schedule table actions', () => {
  it('keeps actions attached to their record after rows are filtered', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn(),
      onDelete = vi.fn()
    const props = {
      workflowNames: { first: 'First', second: 'Second' },
      loading: false,
      error: null,
      onToggle,
      onDelete,
    }
    const { rerender } = render(
      <MemoryRouter>
        <ScheduleListPanel {...props} schedules={schedules} />
      </MemoryRouter>
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
    rerender(
      <MemoryRouter>
        <ScheduleListPanel {...props} schedules={[schedules[1]]} />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('switch', { name: 'Enable schedule for Second' }))
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(schedules[1], true)
    await user.click(screen.getByRole('button', { name: 'Delete schedule for Second' }))
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(schedules[1])
    expect(screen.getByRole('link', { name: 'Second' })).toHaveAttribute(
      'href',
      '/workflows/second/edit'
    )
    expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument()
  })
})
