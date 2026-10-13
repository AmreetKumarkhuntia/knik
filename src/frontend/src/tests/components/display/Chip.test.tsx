import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chip from '$components/display/Chip'

it('names the remove control after its chip', async () => {
  const user = userEvent.setup()
  const remove = vi.fn()
  render(<Chip label="summary" variant="tag" onRemove={remove} />)
  await user.click(screen.getByRole('button', { name: 'Remove summary' }))
  expect(remove).toHaveBeenCalledOnce()
})
