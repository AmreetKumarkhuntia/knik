import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoSessionProvider } from '$widgets/session/DemoSessionProvider'
import ChatWidget from '$widgets/chat/ChatWidget'

describe('ChatWidget', () => {
  it('keeps an editable draft but disables sending without a supplied scenario', async () => {
    const user = userEvent.setup()
    render(
      <DemoSessionProvider source={{ models: [] }}>
        <ChatWidget />
      </DemoSessionProvider>
    )
    const composer = screen.getByPlaceholderText(/Type your message/)
    await user.type(composer, 'Hello')
    expect(composer).toHaveValue('Hello')
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    expect(screen.getByText(/Chat replies are unavailable/)).toBeInTheDocument()
  })

  it('uses only a matching supplied reply and clears the committed draft', async () => {
    const user = userEvent.setup()
    render(
      <DemoSessionProvider
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
      </DemoSessionProvider>
    )
    await user.type(screen.getByPlaceholderText(/Type your message/), 'Hello')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(await screen.findByText('A supplied reply.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type your message/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })
})
