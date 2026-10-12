import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundaryWidget from '$widgets/feedback/ErrorBoundaryWidget'

function Crash({ message }: { message: string }): never {
  throw new Error(message)
}

it('reloads the page to retry a failed route chunk, since React.lazy caches the rejection', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const reload = vi.fn()
  vi.stubGlobal('location', { ...window.location, reload })
  render(
    <ErrorBoundaryWidget>
      <Crash message="Failed to fetch dynamically imported module: /assets/Chat.js" />
    </ErrorBoundaryWidget>
  )
  await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
  expect(reload).toHaveBeenCalledOnce()
})

it('retries other errors by re-rendering', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const reload = vi.fn()
  vi.stubGlobal('location', { ...window.location, reload })
  render(
    <ErrorBoundaryWidget>
      <Crash message="boom" />
    </ErrorBoundaryWidget>
  )
  await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
  expect(reload).not.toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('boom')
})
