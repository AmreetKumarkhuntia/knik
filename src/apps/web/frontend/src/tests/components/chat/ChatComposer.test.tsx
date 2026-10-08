import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatComposer from '$components/chat/ChatComposer'

describe('ChatComposer', () => {
  it('sends with Enter while preserving Shift+Enter and IME composition', () => {
    const send = vi.fn()
    render(<ChatComposer value="A message" onChange={() => {}} onSend={send} />)
    const input = screen.getByRole('textbox', { name: 'Message' })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(send).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(send).toHaveBeenCalledOnce()
  })

  it('exposes why sending is disabled without disabling draft editing', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const change = vi.fn()
    render(
      <ChatComposer
        value=""
        onChange={change}
        onSend={send}
        sendDisabledReason="No demo reply has been supplied."
      />
    )
    const input = screen.getByRole('textbox', { name: 'Message' })
    expect(input).toBeEnabled()
    expect(input).toHaveAccessibleDescription('No demo reply has been supplied.')
    await user.type(input, 'x')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(change).toHaveBeenCalledWith('x')
    expect(send).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voice input' })).toBeDisabled()
  })
})
