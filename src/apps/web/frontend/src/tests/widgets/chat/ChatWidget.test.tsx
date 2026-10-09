import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReactMarkdown from 'react-markdown'
import { StoresProvider } from '$stores'
import ChatWidget from '$widgets/chat/ChatWidget'
import { useSettingsStore } from '$stores/settings'
import { useChatStore } from '$stores/chat'

vi.mock('react-markdown', async importOriginal => {
  const actual = await importOriginal<typeof import('react-markdown')>()
  return { ...actual, default: vi.fn(actual.default) }
})

describe('ChatWidget', () => {
  it('sends any message locally without requiring a model or supplied scenario', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider source={{ models: [] }}>
        <ChatWidget />
      </StoresProvider>
    )
    const composer = screen.getByPlaceholderText(/Type your message/)
    await user.type(composer, 'Hello')
    expect(composer).toHaveValue('Hello')
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Copy message' })).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('uses only a matching supplied reply and clears the committed draft', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider
        source={{
          models: [{ id: 'demo-model', label: 'Demo model' }],
          chatScenarios: [
            {
              prompt: 'Hello',
              modelId: 'demo-model',
              replies: [
                {
                  role: 'assistant',
                  content: 'A supplied reply.',
                  timestamp: '2026-10-08T12:00:00Z',
                  metadata: {},
                },
              ],
            },
          ],
        }}
      >
        <ChatWidget />
      </StoresProvider>
    )
    await user.type(screen.getByPlaceholderText(/Type your message/), 'Hello')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('A supplied reply.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type your message/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })
})

describe('chat working scope lifecycle', () => {
  const source = {
    activeConversationId: 'existing',
    conversations: [
      {
        id: 'existing',
        title: 'Existing conversation',
        messages: [],
        created_at: null,
        updated_at: null,
        summary_message_id: null,
        compacted_count: 0,
        total_tokens: 0,
      },
    ],
    models: [{ id: 'model', label: 'Demo model' }],
    chatScenarios: [
      {
        prompt: 'Hello',
        replies: [
          {
            role: 'assistant' as const,
            content: 'Supplied answer',
            timestamp: '2026-10-08T12:00:00Z',
            metadata: {},
          },
        ],
      },
    ],
  }
  it('keeps simultaneous composer drafts independent while both observe committed messages', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider source={source}>
        <ChatWidget />
        <ChatWidget />
      </StoresProvider>
    )
    const [first, second] = screen.getAllByRole('textbox', { name: 'Message' })
    await user.type(first, 'Hello')
    await user.type(second, 'Another draft')
    await user.click(screen.getAllByRole('button', { name: 'Send message' })[0])
    expect(screen.getAllByText('Supplied answer')).toHaveLength(2)
    expect(first).toHaveValue('')
    expect(second).toHaveValue('Another draft')
    expect(source.conversations[0].messages).toEqual([])
  })
  it('survives StrictMode setup and disposes drafts on unmount while retaining saved messages', async () => {
    const user = userEvent.setup()
    const content = (visible: boolean) => (
      <StrictMode>
        <StoresProvider source={source}>
          {visible ? <ChatWidget /> : <p>Different route</p>}
        </StoresProvider>
      </StrictMode>
    )
    const view = render(content(true))
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Unsaved')
    view.rerender(content(false))
    view.rerender(content(true))
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('')
    expect(screen.getByText('Supplied answer')).toBeInTheDocument()
    view.unmount()
    render(content(true))
    expect(screen.queryByText('Supplied answer')).not.toBeInTheDocument()
  })
})

describe('chat transcript', () => {
  const source = {
    activeConversationId: 'existing',
    conversations: [
      {
        id: 'existing',
        title: 'Existing conversation',
        messages: [
          {
            role: 'user' as const,
            content: 'Show me a snippet',
            timestamp: '2026-10-08T12:00:00Z',
            metadata: {},
          },
          {
            role: 'assistant' as const,
            content: 'Here it is:\n\n```ts\nconst ok = true\n```',
            timestamp: '2026-10-08T12:00:01Z',
            metadata: {},
          },
        ],
        created_at: null,
        updated_at: null,
        summary_message_id: null,
        compacted_count: 0,
        total_tokens: 0,
      },
    ],
  }

  it('does not re-render or re-parse rendered markdown while the draft changes', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider source={source}>
        <ChatWidget />
      </StoresProvider>
    )
    const renders = vi.mocked(ReactMarkdown).mock.calls.length
    expect(renders).toBeGreaterThan(0)
    const composer = screen.getByRole('textbox', { name: 'Message' })
    await user.type(composer, 'A longer draft')
    expect(composer).toHaveValue('A longer draft')
    expect(vi.mocked(ReactMarkdown).mock.calls).toHaveLength(renders)
  })

  it('announces replies through a polite log that is live before the first message', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider
        source={{
          activeConversationId: 'blank',
          conversations: [{ ...source.conversations[0], id: 'blank', messages: [] }],
          chatScenarios: [
            {
              prompt: 'Hello',
              replies: [
                {
                  role: 'assistant',
                  content: 'A supplied reply.',
                  timestamp: '2026-10-08T12:00:00Z',
                  metadata: {},
                },
              ],
            },
          ],
        }}
      >
        <ChatWidget />
      </StoresProvider>
    )
    const log = screen.getByRole('log', { name: 'Conversation' })
    expect(log).toHaveAttribute('aria-live', 'polite')
    expect(log).toBeEmptyDOMElement()
    expect(screen.getByRole('heading', { name: 'How can I help you today?' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello{Enter}')
    expect(screen.getByRole('log', { name: 'Conversation' })).toBe(log)
    expect(within(log).getByText('A supplied reply.')).toBeInTheDocument()
  })

  it('keeps the live log and the focused composer when the first send creates the conversation', async () => {
    const user = userEvent.setup()
    render(
      <StoresProvider
        source={{
          chatScenarios: [
            {
              prompt: 'Hello',
              replies: [
                {
                  role: 'assistant',
                  content: 'A supplied reply.',
                  timestamp: '2026-10-08T12:00:00Z',
                  metadata: {},
                },
              ],
            },
          ],
        }}
      >
        <ChatWidget />
      </StoresProvider>
    )
    const log = screen.getByRole('log', { name: 'Conversation' })
    const composer = screen.getByRole('textbox', { name: 'Message' })
    await user.type(composer, 'Hello{Enter}')
    expect(screen.getByRole('log', { name: 'Conversation' })).toBe(log)
    expect(within(log).getByText('A supplied reply.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Message' })).toBe(composer)
    expect(composer).toHaveFocus()
  })

  it('clears the composer when New chat reuses the open blank conversation', async () => {
    const user = userEvent.setup()
    function NewChat() {
      const startConversation = useChatStore(state => state.startConversation)
      return <button onClick={() => startConversation()}>New chat</button>
    }
    render(
      <StoresProvider source={{}}>
        <NewChat />
        <ChatWidget />
      </StoresProvider>
    )
    await user.click(screen.getByRole('button', { name: 'New chat' }))
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'unsent draft')
    await user.click(screen.getByRole('button', { name: 'New chat' }))
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('')
  })
})

describe('chat tool drawer', () => {
  it('keeps the composer draft and updates shared tool selections while restoring focus on close', async () => {
    const user = userEvent.setup()
    function ToolObserver() {
      const enabled = useSettingsStore(state => state.enabledTools.browser)
      return (
        <output aria-label="Shared browser selection">{enabled ? 'Enabled' : 'Disabled'}</output>
      )
    }
    render(
      <StoresProvider
        source={{ tools: [{ name: 'browser', count: 3, category: 'Browser', enabled: false }] }}
      >
        <ChatWidget />
        <ToolObserver />
      </StoresProvider>
    )
    const composer = screen.getByRole('textbox', { name: 'Message' })
    await user.type(composer, 'Keep this draft')
    const trigger = screen.getByRole('button', { name: 'Tools' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Chat tools' })).toBeInTheDocument()
    const checkbox = screen.getByRole('checkbox', { name: 'browser' })
    expect(checkbox).not.toBeChecked()
    expect(screen.getByLabelText('Shared browser selection')).toHaveTextContent('Disabled')
    await user.click(checkbox)
    expect(screen.getByLabelText('Shared browser selection')).toHaveTextContent('Enabled')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Chat tools' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(composer).toHaveValue('Keep this draft')
    await user.click(trigger)
    expect(screen.getByRole('checkbox', { name: 'browser' })).toBeChecked()
  })
})
