import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatComposer from '$components/chat/ChatComposer'

describe('ChatComposer', () => {
  it('sends arbitrary text with Enter and reserves newlines for Shift+Enter', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    function Composer() {
      const [value, setValue] = useState('Refactor my Python scriptvasca')
      return <ChatComposer value={value} onChange={setValue} onSend={send} />
    }
    render(<Composer />)
    const input = screen.getByRole('textbox', { name: 'Message' })
    await user.click(input)
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('Refactor my Python scriptvasca')
    expect(send).toHaveBeenCalledOnce()
    await user.keyboard('{Shift>}{Enter}{/Shift}second line')
    expect(input).toHaveValue('Refactor my Python scriptvasca\nsecond line')
    expect(send).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(send).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

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

  it('does not send empty messages or submit a disabled composer', () => {
    const send = vi.fn()
    const view = render(<ChatComposer value="   " onChange={() => {}} onSend={send} />)
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message' }), { key: 'Enter' })
    view.rerender(<ChatComposer value="A message" onChange={() => {}} onSend={send} disabled />)
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message' }), { key: 'Enter' })
    expect(send).not.toHaveBeenCalled()
  })
})
