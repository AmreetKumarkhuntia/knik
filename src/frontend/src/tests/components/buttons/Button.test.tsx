import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '$components/buttons/Button'
it('buttons submit only explicitly and block disabled/loading activation', async () => {
  const submit = vi.fn(),
    click = vi.fn(),
    user = userEvent.setup()
  render(
    <form
      onSubmit={event => {
        event.preventDefault()
        submit()
      }}
    >
      <Button onClick={click}>Ordinary</Button>
      <Button loading onClick={click}>
        Waiting
      </Button>
      <Button type="submit">Save</Button>
    </form>
  )
  await user.click(screen.getByRole('button', { name: 'Ordinary' }))
  expect(submit).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Waiting' }))
  expect(click).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Save' }))
  expect(submit).toHaveBeenCalledTimes(1)
})
