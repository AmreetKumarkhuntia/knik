import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StoresProvider } from '$stores'
import { useFeedbackStore } from '$stores/feedback'
import RemoteSettingsPane from '$widgets/settings/RemoteSettingsPane'
import { fakeTransport } from './remoteSettings'

function Toasts() {
  const toasts = useFeedbackStore(s => s.toasts)
  return (
    <ul aria-label="Toasts">
      {toasts.map(toast => (
        <li key={toast.id}>{toast.message}</li>
      ))}
    </ul>
  )
}

function renderPane(transport = fakeTransport()) {
  render(
    <StoresProvider source={{}} settingsTransport={transport}>
      <RemoteSettingsPane />
      <Toasts />
    </StoresProvider>
  )
  return transport
}

describe('backend settings pane', () => {
  it('renders the schema as groups in backend order, with a control per type and no fetch', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
    renderPane()
    expect(await screen.findByLabelText('Display name')).toHaveValue('Alex')
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual([
      'Profile',
      'AI',
      'Voice',
    ])
    expect(screen.getByLabelText('Provider')).toHaveValue('vertex')
    expect(screen.getByLabelText('Temperature')).toHaveAttribute('type', 'number')
    expect(screen.getByRole('switch', { name: 'Speak replies' })).toBeChecked()
    expect(screen.getByText("Empty leaves the provider's own limit.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('posts only the changed keys, typed, then reloads and clears the draft', async () => {
    const user = userEvent.setup()
    const transport = renderPane()
    const name = await screen.findByLabelText('Display name')
    await user.type(name, ' Lee')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Voice' }), 'am_adam')
    await user.click(screen.getByRole('switch', { name: 'Speak replies' }))
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '0.3')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() =>
      expect(transport.save).toHaveBeenCalledWith({
        display_name: 'Alex Lee',
        voice_name: 'am_adam',
        enable_voice_output: false,
        temperature: 0.3,
      })
    )
    await waitFor(() => expect(transport.load).toHaveBeenCalledTimes(2))
    // The fake does not persist, so the reloaded value shows the draft is gone.
    await waitFor(() => expect(screen.getByLabelText('Display name')).toHaveValue('Alex'))
    expect(screen.getByText('Settings saved.')).toBeInTheDocument()
  })

  it('cancels a draft and rejects text that is not a whole number', async () => {
    const user = userEvent.setup()
    renderPane()
    const name = await screen.findByLabelText('Display name')
    await user.type(name, ' Lee')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(name).toHaveValue('Alex')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
    await user.clear(screen.getByLabelText('Max output tokens'))
    await user.type(screen.getByLabelText('Max output tokens'), '1.5')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole number.')
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
  })

  it('never prefills a secret and counts anything typed into it as a change', async () => {
    const user = userEvent.setup()
    const transport = renderPane()
    const secret = await screen.findByLabelText('Custom API key')
    expect(secret).toHaveAttribute('type', 'password')
    expect(secret).toHaveValue('')
    expect(secret).toHaveAttribute('placeholder', 'Set (hidden)')
    await user.type(secret, 'new-key')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(transport.save).toHaveBeenCalledWith({ custom_api_key: 'new-key' }))
  })

  it('offers Reset only on stored values and reloads after it', async () => {
    const user = userEvent.setup()
    const transport = renderPane()
    await screen.findByLabelText('Display name')
    expect(screen.queryByRole('button', { name: 'Reset Display name' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset Model' }))
    await waitFor(() => expect(transport.reset).toHaveBeenCalledWith('ai_model'))
    await waitFor(() => expect(transport.load).toHaveBeenCalledTimes(2))
  })

  it('shows a Retry state when the backend cannot be reached', async () => {
    const user = userEvent.setup()
    const transport = fakeTransport()
    transport.load.mockRejectedValue(new Error('Failed to fetch'))
    renderPane(transport)
    expect(await screen.findByText('Settings are unavailable')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(transport.load).toHaveBeenCalledTimes(2))
  })

  it('keeps the draft and reports the backend message when a save fails', async () => {
    const user = userEvent.setup()
    const transport = fakeTransport()
    transport.save.mockRejectedValue(new Error('temperature must be float'))
    renderPane(transport)
    const name = await screen.findByLabelText('Display name')
    await user.type(name, ' Lee')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('temperature must be float')).toBeInTheDocument()
    expect(name).toHaveValue('Alex Lee')
    expect(transport.load).toHaveBeenCalledTimes(1)
  })
})
