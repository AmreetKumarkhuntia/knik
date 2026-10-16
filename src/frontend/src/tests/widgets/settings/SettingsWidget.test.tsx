import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StoresProvider } from '$stores'
import SettingsWidget from '$widgets/settings/SettingsWidget'
import type { DemoSource } from '$types/demo-session'
import { resizeTo } from '../../hooks/matchMedia'
import { fakeTransport } from './remoteSettings'

const EMPTY: DemoSource = { models: [], providers: [], tools: [], apiKeys: [] }

function renderSettings(source?: DemoSource, transport = fakeTransport()) {
  return render(
    <StoresProvider source={{ ...EMPTY, ...source }} settingsTransport={transport}>
      <SettingsWidget />
    </StoresProvider>
  )
}

describe('settings session interactions', () => {
  it('drops an unsaved backend draft when the pane is left', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.type(await screen.findByLabelText('Display name'), ' unsaved')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled()
    await user.click(screen.getByText('Appearance', { exact: true }))
    await user.click(screen.getByText('General', { exact: true }))
    expect(await screen.findByLabelText('Display name')).toHaveValue('Alex')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
  })

  it('retains appearance changes within a provider and resets with a new provider', async () => {
    const user = userEvent.setup()
    const source: DemoSource = { appearance: { mode: 'dark' } }
    const first = renderSettings(source)
    await user.click(screen.getByText('Appearance', { exact: true }))
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    await user.click(screen.getByText('General', { exact: true }))
    await user.click(screen.getByText('Appearance', { exact: true }))
    expect((screen.getByRole('radio', { name: 'Light' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.queryByRole('switch', { name: 'Compact density' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Accent color' })).not.toBeInTheDocument()
    first.unmount()
    renderSettings(source)
    await user.click(screen.getByText('Appearance', { exact: true }))
    expect((screen.getByRole('radio', { name: 'Dark' }) as HTMLInputElement).checked).toBe(true)
    expect(source.appearance?.mode).toBe('dark')
  })

  it('shows explicit empty states', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByText('Providers', { exact: true }))
    expect(screen.getByText('No tool groups available.')).toBeTruthy()
    await user.click(screen.getByText('API keys', { exact: true, selector: 'button' }))
    expect(screen.getByText('No API keys available.')).toBeTruthy()
  })

  it('confirms local deletion of a listed key', async () => {
    const user = userEvent.setup()
    renderSettings({
      apiKeys: [
        {
          id: 'demo-key',
          label: 'Browser demo',
          key_prefix: 'demo_',
          scopes: ['read'],
          created_at: null,
          last_used_at: null,
        },
      ],
    })
    await user.click(screen.getByText('API keys', { exact: true, selector: 'button' }))
    await user.click(screen.getByRole('button', { name: 'Remove Browser demo' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Browser demo')).toBeTruthy()
    // Dialogs animate out, so wait for each to unmount before querying the page again.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Remove Browser demo' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove key' }))
    expect(screen.getByText('No API keys available.')).toBeTruthy()
  })

  it('renders arbitrary catalogs from the demo session and preserves local selections', async () => {
    const user = userEvent.setup()
    const source: DemoSource = {
      tools: [{ name: 'Source Tools', category: 'Custom', count: 3, enabled: false }],
      apiKeys: [
        {
          id: 'source-key',
          label: 'Source Key',
          key_prefix: 'example_',
          scopes: ['read'],
          created_at: null,
          last_used_at: null,
        },
      ],
    }
    const fetcher = vi.spyOn(globalThis, 'fetch')
    renderSettings(source)
    await user.click(screen.getByRole('tab', { name: 'Providers' }))
    await user.click(screen.getByRole('switch', { name: /Source Tools/ }))
    await user.click(screen.getByRole('tab', { name: 'API keys' }))
    expect(screen.getByText('Source Key')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Providers' }))
    expect(screen.getByRole('switch', { name: /Source Tools/ })).toBeChecked()
    expect(source.tools?.[0].enabled).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe('settings layout', () => {
  it('nests settings group headings directly under the page heading', async () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })

  it('lays the pane tabs out horizontally at mobile widths', () => {
    resizeTo(390)
    renderSettings()
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal')
  })
})

describe('settings deep links', () => {
  it('opens the requested pane once and reports it as applied', () => {
    const applied = vi.fn()
    render(
      <StoresProvider source={EMPTY} settingsTransport={fakeTransport()}>
        <SettingsWidget requestedTab="keys" onRequestedTabApplied={applied} />
      </StoresProvider>
    )
    expect(screen.getByRole('tab', { name: 'API keys' })).toHaveAttribute('aria-selected', 'true')
    expect(applied).toHaveBeenCalledTimes(1)
  })

  it('ignores an unknown pane', () => {
    const applied = vi.fn()
    render(
      <StoresProvider source={EMPTY} settingsTransport={fakeTransport()}>
        <SettingsWidget requestedTab="missing" onRequestedTabApplied={applied} />
      </StoresProvider>
    )
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    expect(applied).not.toHaveBeenCalled()
  })
})
