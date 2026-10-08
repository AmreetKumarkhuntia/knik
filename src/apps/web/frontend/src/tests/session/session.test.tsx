import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoSessionProvider } from '$widgets/session'
import { useDemoSession } from '$widgets/session/useDemoSession'
import { createDemoSessionStore } from '$widgets/session/store'
import type { DemoSource } from '$types/demo-session'

const source: DemoSource = { settings: { display_name: 'Initial' }, appearance: { mode: 'dark' } }
function Editor() {
  const name = useDemoSession(state => state.settings.display_name)
  const update = useDemoSession(state => state.updateSettings)
  return <button onClick={() => update({ display_name: 'Changed' })}>{name}</button>
}
function Reader() {
  const name = useDemoSession(state => state.settings.display_name)
  return <output aria-label="Shared name">{name}</output>
}

describe('widget-owned session', () => {
  it('publishes committed edits, retains them on rerender and resets on remount', async () => {
    const user = userEvent.setup()
    const view = render(
      <DemoSessionProvider source={source}>
        <Editor />
        <Reader />
      </DemoSessionProvider>
    )
    await user.click(screen.getByRole('button', { name: 'Initial' }))
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Changed')
    view.rerender(
      <DemoSessionProvider source={{ settings: { display_name: 'Other seed' } }}>
        <Reader />
      </DemoSessionProvider>
    )
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Changed')
    view.unmount()
    render(
      <DemoSessionProvider source={source}>
        <Reader />
      </DemoSessionProvider>
    )
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Initial')
    expect(source.settings?.display_name).toBe('Initial')
  })
  it('isolates providers and never reads or writes browser storage', async () => {
    const read = vi.spyOn(Storage.prototype, 'getItem'),
      write = vi.spyOn(Storage.prototype, 'setItem')
    render(
      <>
        <DemoSessionProvider source={source}>
          <Editor />
        </DemoSessionProvider>
        <DemoSessionProvider source={source}>
          <Reader />
        </DemoSessionProvider>
      </>
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Initial' }))
    expect(screen.getByLabelText('Shared name')).toHaveTextContent('Initial')
    expect(read).not.toHaveBeenCalled()
    expect(write).not.toHaveBeenCalled()
  })
  it('starts empty without choosing existing fixtures or fabricating outcomes', () => {
    const store = createDemoSessionStore()
    expect(store.getState().workflows).toEqual([])
    expect(store.getState().sendMessage('Hello')).toMatchObject({ ok: false })
    expect(store.getState().runWorkflow('missing')).toMatchObject({ ok: false })
    expect(store.getState().createDemoKey('new')).toMatchObject({ ok: false })
    expect(store.getState().conversations).toEqual([])
    expect(store.getState().executions).toEqual([])
    expect(store.getState().apiKeys).toEqual([])
  })
  it('deep-clones supplied records and preserves a missing selection as empty', () => {
    const seed: DemoSource = {
      activeConversationId: 'missing',
      workflows: [{ id: 'w', name: 'Original', definition: { nodes: {}, connections: [] } }],
    }
    const a = createDemoSessionStore(seed),
      b = createDemoSessionStore(seed)
    a.getState().saveWorkflow({ ...a.getState().workflows[0], name: 'Edited' })
    expect(seed.workflows?.[0].name).toBe('Original')
    expect(b.getState().workflows[0].name).toBe('Original')
    expect(a.getState().activeConversationId).toBeNull()
  })
  it('uses only supplied chat outcomes and removes a deleted active conversation', () => {
    const seed: DemoSource = {
      chatScenarios: [
        {
          prompt: ' Hello ',
          replies: [
            {
              role: 'assistant',
              content: 'Supplied reply',
              timestamp: '2026-10-08T00:00:00Z',
              metadata: {},
            },
          ],
        },
      ],
    }
    const store = createDemoSessionStore(seed)
    expect(store.getState().sendMessage('Hello')).toMatchObject({ ok: true })
    const conversation = store.getState().conversations[0]
    expect(conversation.messages.map(message => message.content)).toEqual([
      'Hello',
      'Supplied reply',
    ])
    store.getState().deleteConversation(conversation.id)
    expect(store.getState().activeConversationId).toBeNull()
    expect(seed.chatScenarios?.[0].replies).toHaveLength(1)
  })
})
