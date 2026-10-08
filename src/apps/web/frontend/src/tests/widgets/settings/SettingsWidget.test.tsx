import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DemoSessionProvider } from '$widgets/session/DemoSessionProvider'
import SettingsWidget from '$widgets/settings/SettingsWidget'
import type { DemoSource } from '$types/demo-session'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderSettings(source?: DemoSource) {
  return render(
    <DemoSessionProvider
      source={{ models: [], providers: [], tools: [], voices: [], apiKeys: [], ...source }}
    >
      <SettingsWidget />
    </DemoSessionProvider>
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
    const source: DemoSource = { appearance: { mode: 'dark', density: 'comfortable' } }
    const first = renderSettings(source)
    await user.click(screen.getByText('Appearance', { exact: true }))
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    await user.click(screen.getByRole('switch', { name: 'Compact density' }))
    await user.click(screen.getByText('General', { exact: true }))
    await user.click(screen.getByText('Appearance', { exact: true }))
    expect((screen.getByRole('radio', { name: 'Light' }) as HTMLInputElement).checked).toBe(true)
    expect(
      (screen.getByRole('switch', { name: 'Compact density' }) as HTMLInputElement).checked
    ).toBe(true)
    first.unmount()
    renderSettings(source)
    await user.click(screen.getByText('Appearance', { exact: true }))
    expect((screen.getByRole('radio', { name: 'Dark' }) as HTMLInputElement).checked).toBe(true)
    expect(
      (screen.getByRole('switch', { name: 'Compact density' }) as HTMLInputElement).checked
    ).toBe(false)
    expect(source.appearance?.mode).toBe('dark')
  })

  it('shows explicit empty states and disables unsupported key and voice actions', async () => {
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
    expect(
      (screen.getByRole('button', { name: 'Preview voice' }) as HTMLButtonElement).disabled
    ).toBe(true)
    await user.click(screen.getByText('API keys', { exact: true, selector: 'button' }))
    expect(screen.getByText('No API keys available.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Create key' }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })

  it('validates a key scenario, preserves invalid drafts, and confirms local deletion', async () => {
    const user = userEvent.setup()
    const source: DemoSource = {
      keyScenarios: [
        {
          id: 'demo-key',
          label: 'Browser demo',
          key_prefix: 'demo_',
          key: 'supplied-demo-secret',
          scopes: ['read'],
        },
      ],
    }
    renderSettings(source)
    await user.click(screen.getByText('API keys', { exact: true, selector: 'button' }))
    await user.click(screen.getByRole('button', { name: 'Create key' }))
    await user.type(screen.getByLabelText('Key name'), 'Unknown label')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create key' }))
    expect(screen.getByText('No demo key is supplied for this label.')).toBeTruthy()
    expect((screen.getByLabelText('Key name') as HTMLInputElement).value).toBe('Unknown label')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Create key' }))
    expect((screen.getByLabelText('Key name') as HTMLInputElement).value).toBe('')
    await user.type(screen.getByLabelText('Key name'), 'Browser demo')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create key' }))
    expect(screen.getByText('supplied-demo-secret')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Remove Browser demo' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Browser demo')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove Browser demo' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove key' }))
    expect(screen.getByText('No API keys available.')).toBeTruthy()
    expect(source.keyScenarios).toHaveLength(1)
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

  it('plays only the supplied voice asset and stops it when leaving the pane', async () => {
    const play = vi.fn().mockResolvedValue(undefined)
    const pause = vi.fn()
    const sources: string[] = []
    vi.stubGlobal(
      'Audio',
      class {
        playbackRate = 1
        onended: (() => void) | null = null
        play = play
        pause = pause
        constructor(src: string) {
          sources.push(src)
        }
      }
    )
    const user = userEvent.setup()
    renderSettings({
      settings: { voice: 'supplied-voice', speaking_rate: 1.2 },
      voices: [{ id: 'supplied-voice', name: 'Supplied voice', audioSrc: '/demo/voice.ogg' }],
    })
    await user.click(screen.getByRole('tab', { name: 'Voice' }))
    expect(play).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Preview voice' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop preview' })).toBeTruthy())
    expect(sources).toEqual(['/demo/voice.ogg'])
    expect(play).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('tab', { name: 'General' }))
    expect(pause).toHaveBeenCalledOnce()
  })
})
