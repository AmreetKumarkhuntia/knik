import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useReducedMotionConfig } from 'framer-motion'
import App from '../../App'
import * as pages from '$pages'

vi.mock('$widgets/chat/ChatWidget', () => ({
  default: function MotionProbe() {
    return <p>{useReducedMotionConfig() ? 'Motion reduced' : 'Motion full'}</p>
  },
}))

// jsdom has no matchMedia; framer-motion reads the reduced-motion query once per module load.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
})
afterAll(() => {
  Reflect.deleteProperty(window, 'matchMedia')
})
// The settings page asks the backend for its schema; here there is none, so it shows its Retry state.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('offline')))
  )
})

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App routes', () => {
  it('splits every route page into a lazily loaded chunk', () => {
    for (const page of Object.values(pages)) {
      expect(page.$$typeof).toBe(Symbol.for('react.lazy'))
    }
  })

  it('keeps the layout mounted while a route chunk loads, then renders the page', async () => {
    const { container } = renderAt('/settings')
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(container.querySelector('main .knik-spinner')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'General' })).toBeInTheDocument()
    expect(container.querySelector('main .knik-spinner')).toBeNull()
  })

  it('opens the settings pane named in the tab search param, then drops the param', async () => {
    renderAt('/settings?tab=keys')
    expect(await screen.findByRole('tab', { name: 'API keys' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await waitFor(() => expect(window.location.search).toBe(''))
    expect(window.location.pathname).toBe('/settings')
  })

  it.each([
    ['/workflows', '5 of 5 shown'],
    ['/workflows/executions', 'Showing 6 of 6 executions'],
    ['/schedules', 'Every day at 09:00'],
  ])('renders the seeded page for %s', async (path, text) => {
    renderAt(path)
    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it('lets framer-motion honour the prefers-reduced-motion setting', async () => {
    renderAt('/')
    expect(await screen.findByText('Motion reduced')).toBeInTheDocument()
  })
})
