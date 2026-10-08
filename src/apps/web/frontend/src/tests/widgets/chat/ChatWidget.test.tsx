import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoresProvider } from '$stores'
import ChatWidget from '$widgets/chat/ChatWidget'

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
