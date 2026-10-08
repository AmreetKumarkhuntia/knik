import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DemoSessionProvider } from '$widgets/session'
import MainLayoutWidget from '$widgets/layout/MainLayoutWidget'

describe('MainLayoutWidget command data', () => {
  it('filters commands in the widget and discards the query when the widget unmounts', async () => {
    const user = userEvent.setup()
    const content = (
      <MemoryRouter>
        <DemoSessionProvider>
          <MainLayoutWidget>
            <p>Route content</p>
          </MainLayoutWidget>
        </DemoSessionProvider>
      </MemoryRouter>
    )
    const view = render(content)
    await user.keyboard('{Control>}k{/Control}')
    await user.type(screen.getByRole('textbox', { name: 'Search commands' }), 'settings')
    const dialog = screen.getByRole('dialog', { name: 'Commands' })
    expect(within(dialog).getByRole('button', { name: 'Open Settings' })).toBeInTheDocument()
    expect(
      within(dialog).queryByRole('button', { name: 'Go to Workflows' })
    ).not.toBeInTheDocument()
    view.rerender(
      <MemoryRouter>
        <DemoSessionProvider>
          <p>Different layout</p>
        </DemoSessionProvider>
      </MemoryRouter>
    )
    view.rerender(content)
    await user.keyboard('{Control>}k{/Control}')
    expect(screen.getByRole('textbox', { name: 'Search commands' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Go to Workflows' })).toBeInTheDocument()
  })
})
