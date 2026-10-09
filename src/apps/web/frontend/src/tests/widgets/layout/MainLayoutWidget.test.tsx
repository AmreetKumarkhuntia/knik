import { Profiler } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { StoresProvider } from '$stores'
import MainLayoutWidget from '$widgets/layout/MainLayoutWidget'
import ChatWidget from '$widgets/chat/ChatWidget'
import '../../hooks/matchMedia'
import { COMMAND_GROUPS } from '$lib/constants/navigation'

const commandDialog = () => within(screen.getByRole('dialog', { name: 'Commands' }))

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current location">{location.pathname + location.search}</output>
}

function renderShell(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <StoresProvider source={{}}>
        <MainLayoutWidget>
          <LocationProbe />
        </MainLayoutWidget>
      </StoresProvider>
    </MemoryRouter>
  )
  return () => screen.getByRole('status', { name: 'Current location' })
}

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
    await user.type(commandDialog().getByLabelText('Search commands'), 'settings')
    expect(commandDialog().getByText('Open Settings')).toBeInTheDocument()
    expect(commandDialog().queryByText('Go to Workflows')).not.toBeInTheDocument()
    view.rerender(
      <MemoryRouter>
        <StoresProvider source={{}}>
          <p>Different layout</p>
        </StoresProvider>
      </MemoryRouter>
    )
    view.rerender(content)
    await user.keyboard('{Control>}k{/Control}')
    expect(commandDialog().getByLabelText('Search commands')).toHaveValue('')
    expect(commandDialog().getByText('Go to Workflows')).toBeInTheDocument()
  })

  it('starts a new chat from the advertised ⌘J shortcut', () => {
    const location = renderShell('/workflows')
    expect(screen.queryByText('New conversation')).not.toBeInTheDocument()
    expect(fireEvent.keyDown(window, { key: 'j', metaKey: true })).toBe(false)
    expect(location()).toHaveTextContent(/^\/$/)
    expect(screen.getByText('New conversation')).toBeInTheDocument()
  })

  it('closes the command palette when ⌘J starts a new chat from inside it', async () => {
    const user = userEvent.setup()
    const location = renderShell('/workflows')
    await user.keyboard('{Control>}k{/Control}')
    await user.keyboard('{Control>}j{/Control}')
    expect(screen.queryByRole('dialog', { name: 'Commands' })).not.toBeInTheDocument()
    expect(location()).toHaveTextContent(/^\/$/)
  })

  it.each(
    COMMAND_GROUPS.flatMap(group => group.items).filter(
      (item): item is typeof item & { path: string } => item.path !== undefined
    )
  )('opens $path from "$label"', async ({ label, path }) => {
    const user = userEvent.setup()
    const location = renderShell('/start')
    await user.keyboard('{Control>}k{/Control}')
    await user.click(commandDialog().getByText(label))
    expect(location()).toHaveTextContent(new RegExp(`^${path.replace('?', '\\?')}$`))
  })

  it('opens the API keys pane from Manage API keys', async () => {
    const user = userEvent.setup()
    const location = renderShell('/')
    await user.keyboard('{Control>}k{/Control}')
    await user.click(commandDialog().getByText('Manage API keys'))
    expect(location()).toHaveTextContent('/settings?tab=keys')
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
  function renderProfiledShell() {
    const commits: { phase: string; sidebar: boolean; menu: boolean }[] = []
    render(
      <MemoryRouter>
        <StoresProvider source={{}}>
          <Profiler
            id="shell"
            onRender={(_id, phase) =>
              commits.push({
                phase,
                sidebar: document.querySelector('aside[aria-label="Workspace sidebar"]') !== null,
                menu: document.querySelector('button[aria-label="Open navigation"]') !== null,
              })
            }
          >
            <MainLayoutWidget>
              <p>Route content</p>
            </MainLayoutWidget>
          </Profiler>
        </StoresProvider>
      </MemoryRouter>
    )
    return commits
  }

  it('commits the mobile drawer layout on the first render', () => {
    resize(390)
    const commits = renderProfiledShell()
    expect(commits[0]).toEqual({ phase: 'mount', sidebar: false, menu: true })
  })

  it('re-renders the shell only when a resize crosses a breakpoint', () => {
    resize(1440)
    const commits = renderProfiledShell()
    const settled = commits.length
    resize(1300)
    resize(1100)
    expect(commits).toHaveLength(settled)
    resize(900)
    expect(commits.length).toBeGreaterThan(settled)
    expect(commits.at(-1)).toMatchObject({ sidebar: true, menu: false })
  })

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
