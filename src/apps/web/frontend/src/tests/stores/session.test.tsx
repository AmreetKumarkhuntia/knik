import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoresProvider } from '$stores'
import { useSettingsStore } from '$stores/settings'
import { createStoreBundle } from '$lib/stores/session/createStoreBundle'
import type { DemoSource } from '$types/demo-session'

const source: DemoSource = { settings: { display_name: 'Initial' }, appearance: { mode: 'dark' } }
function Editor() {
  const name = useSettingsStore(state => state.settings.display_name)
  const update = useSettingsStore(state => state.updateSettings)
  return <button onClick={() => update({ display_name: 'Changed' })}>{name}</button>
}
function Reader() {
  const name = useSettingsStore(state => state.settings.display_name)
  return <output aria-label="Shared name">{name}</output>
}

describe('independent store session', () => {
  it('publishes committed edits, retains them on rerender and resets on remount', async () => {
    const user = userEvent.setup()
    const view = render(
      <StoresProvider source={source}>
        <Editor />
        <Reader />
      </StoresProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Initial' }))
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Changed')
    view.rerender(
      <StoresProvider source={{ settings: { display_name: 'Other seed' } }}>
        <Reader />
      </StoresProvider>
    )
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Changed')
    view.unmount()
    render(
      <StoresProvider source={source}>
        <Reader />
      </StoresProvider>
    )
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Initial')
    expect(source.settings?.display_name).toBe('Initial')
  })
  it('isolates providers and never reads or writes browser storage', async () => {
    const read = vi.spyOn(Storage.prototype, 'getItem'),
      write = vi.spyOn(Storage.prototype, 'setItem')
    render(
      <>
        <StoresProvider source={source}>
          <Editor />
        </StoresProvider>
        <StoresProvider source={source}>
          <Reader />
        </StoresProvider>
      </>
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Initial' }))
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Initial')
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })
  it('loads bundled samples by default and keeps explicitly supplied empty sources empty', () => {
    const populated = createStoreBundle()
    expect(populated.workflows.getState().workflows).toHaveLength(5)
    expect(populated.chat.getState().conversations).toHaveLength(5)
    const empty = createStoreBundle({})
    expect(empty.workflows.getState().workflows).toEqual([])
    expect(empty.executions.getState().executions).toEqual([])
    expect(empty.catalogs.getState().models).toEqual([])
    expect(empty.commands.runWorkflow('missing')).toMatchObject({ ok: false })
    expect(empty.commands.sendMessage('missing')).toMatchObject({ ok: false })
  })
  it('isolates independent stores and clones supplied records', () => {
    const seed: DemoSource = { settings: { display_name: 'Initial' } }
    const first = createStoreBundle(seed),
      second = createStoreBundle(seed)
    const executionListener = vi.fn()
    first.executions.subscribe(executionListener)
    first.settings.getState().updateSettings({ display_name: 'Changed' })
    expect(first.settings.getState().settings.display_name).toBe('Changed')
    expect(second.settings.getState().settings.display_name).toBe('Initial')
    expect(seed.settings?.display_name).toBe('Initial')
    expect(executionListener).not.toHaveBeenCalled()
    expect(first.chat).not.toBe(second.chat)
    expect(first.chat).not.toBe(first.settings)
  })
})
