import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StoresProvider } from '$stores'
import SettingsWidget from '$widgets/settings/SettingsWidget'
import type { DemoSource } from '$types/demo-session'
import { resizeTo } from '../../hooks/matchMedia'

function renderSettings(source?: DemoSource) {
  return render(
    <StoresProvider
      source={{ models: [], providers: [], tools: [], voices: [], apiKeys: [], ...source }}
    >
      <SettingsWidget />
    </StoresProvider>
  )
}

describe('settings session interactions', () => {
  it('saves profile changes across panes, cancels drafts, and leaves the source untouched', async () => {
    const user = userEvent.setup()
    const source = { settings: { display_name: 'Alex', username: 'alex' } }
    renderSettings(source)
    const displayName = screen.getByLabelText('Display name') as HTMLInputElement
    await user.clear(displayName)
    await user.type(displayName, 'Discard me')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(displayName.value).toBe('Alex')
    await user.clear(displayName)
    await user.type(displayName, 'Alex Lee')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    await user.click(screen.getByText('Appearance', { exact: true }))
    await user.click(screen.getByText('General', { exact: true }))
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Alex Lee')
    expect(source.settings.display_name).toBe('Alex')
    await user.type(screen.getByLabelText('Display name'), ' unsaved')
    await user.click(screen.getByText('Appearance', { exact: true }))
    await user.click(screen.getByText('General', { exact: true }))
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Alex Lee')
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
    expect(
      (screen.getByRole('combobox', { name: 'Default model' }) as HTMLSelectElement).disabled
    ).toBe(true)
    await user.click(screen.getByText('Providers', { exact: true }))
    expect(screen.getByText('No providers available.')).toBeTruthy()
    expect(screen.getByText('No tool groups available.')).toBeTruthy()
    await user.click(screen.getByText('Voice', { exact: true, selector: 'button' }))
    expect(screen.getByText('No voices available.')).toBeTruthy()
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
      models: [{ id: 'source-model', label: 'Source Model' }],
      providers: [{ id: 'source-provider', name: 'Source Provider' }],
      voices: [{ id: 'source-voice', name: 'Source Voice' }],
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
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Default model' }),
      'source-model'
    )
    await user.click(screen.getByRole('tab', { name: 'Providers' }))
    await user.click(screen.getByRole('radio', { name: /Source Provider/ }))
    await user.click(screen.getByRole('checkbox', { name: /Source Tools/ }))
    await user.click(screen.getByRole('tab', { name: 'Voice' }))
    await user.click(screen.getByRole('radio', { name: /Source Voice/ }))
    await user.click(screen.getByRole('tab', { name: 'API keys' }))
    expect(screen.getByText('Source Key')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Providers' }))
    expect(screen.getByRole('radio', { name: /Source Provider/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Source Tools/ })).toBeChecked()
    await user.click(screen.getByRole('tab', { name: 'Voice' }))
    expect(screen.getByRole('radio', { name: /Source Voice/ })).toBeChecked()
    await user.click(screen.getByRole('tab', { name: 'General' }))
    expect(screen.getByRole('combobox', { name: 'Default model' })).toHaveValue('source-model')
    expect(source.tools?.[0].enabled).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe('settings layout', () => {
  it('nests settings group headings directly under the page heading', () => {
    renderSettings()
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument()
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
      <StoresProvider source={{ models: [], providers: [], tools: [], voices: [], apiKeys: [] }}>
        <SettingsWidget requestedTab="keys" onRequestedTabApplied={applied} />
      </StoresProvider>
    )
    expect(screen.getByRole('tab', { name: 'API keys' })).toHaveAttribute('aria-selected', 'true')
    expect(applied).toHaveBeenCalledTimes(1)
  })

  it('ignores an unknown pane', () => {
    const applied = vi.fn()
    render(
      <StoresProvider source={{ models: [], providers: [], tools: [], voices: [], apiKeys: [] }}>
        <SettingsWidget requestedTab="missing" onRequestedTabApplied={applied} />
      </StoresProvider>
    )
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true')
    expect(applied).not.toHaveBeenCalled()
  })
})
