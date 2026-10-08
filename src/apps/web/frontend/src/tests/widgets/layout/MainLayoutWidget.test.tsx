import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StoresProvider } from '$stores'
import MainLayoutWidget from '$widgets/layout/MainLayoutWidget'
import ChatWidget from '$widgets/chat/ChatWidget'

describe('MainLayoutWidget command data', () => {
  it('filters commands in the widget and discards the query when the widget unmounts', async () => {
    const user = userEvent.setup()
    const content = (
      <MemoryRouter>
        <StoresProvider source={{}}>
          <MainLayoutWidget>
            <p>Route content</p>
          </MainLayoutWidget>
        </StoresProvider>
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
        <StoresProvider source={{}}>
          <p>Different layout</p>
        </StoresProvider>
      </MemoryRouter>
    )
    view.rerender(content)
    await user.keyboard('{Control>}k{/Control}')
    expect(screen.getByRole('textbox', { name: 'Search commands' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Go to Workflows' })).toBeInTheDocument()
  })
})

const originalWidth = window.innerWidth
function resize(width: number) {
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    window.dispatchEvent(new Event('resize'))
  })
}
afterEach(() => resize(originalWidth))

describe('responsive workspace navigation', () => {
  it('uses a tablet rail without overwriting the desktop sidebar preference', async () => {
    const user = userEvent.setup()
    resize(1440)
    render(
      <MemoryRouter>
        <StoresProvider source={{}}>
          <MainLayoutWidget>
            <p>Route content</p>
          </MainLayoutWidget>
        </StoresProvider>
      </MemoryRouter>
    )
    const sidebar = screen.getByRole('complementary', { name: 'Workspace sidebar' })
    expect(sidebar).toHaveStyle({ width: '232px' })
    resize(900)
    expect(sidebar).toHaveStyle({ width: '64px' })
    resize(1440)
    expect(sidebar).toHaveStyle({ width: '232px' })
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    resize(900)
    resize(1440)
    expect(sidebar).toHaveStyle({ width: '64px' })
  })

  it('keeps the chat draft across viewport changes and closes mobile navigation after selecting a route', async () => {
    const user = userEvent.setup()
    resize(1440)
    render(
      <MemoryRouter>
        <StoresProvider source={{}}>
          <MainLayoutWidget>
            <ChatWidget />
          </MainLayoutWidget>
        </StoresProvider>
      </MemoryRouter>
    )
    const composer = screen.getByRole('textbox', { name: 'Message' })
    await user.type(composer, 'A draft to keep')
    resize(390)
    expect(composer).toHaveValue('A draft to keep')
    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)
    expect(screen.getAllByRole('navigation', { name: 'Workspace' })).toHaveLength(1)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(composer).toHaveValue('A draft to keep')
    await user.click(trigger)
    await user.click(
      within(screen.getByRole('dialog', { name: 'Navigation' })).getByRole('link', {
        name: 'Workflows',
      })
    )
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument()
    resize(1440)
    expect(composer).toHaveValue('A draft to keep')
  })
})
