import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelPicker from '$components/chat/ModelPicker'

describe('ModelPicker', () => {
  it('renders safely when models have not been supplied', () => {
    render(<ModelPicker model="" models={[]} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Chat model' })).toBeDisabled()
    expect(screen.getByText('No models available')).toBeInTheDocument()
  })

  it('supports keyboard selection and restores focus to its trigger', async () => {
    const user = userEvent.setup()
    const change = vi.fn()
    render(
      <ModelPicker
        model="first"
        models={[
          { id: 'first', label: 'First' },
          { id: 'second', label: 'Second' },
        ]}
        onChange={change}
      />
    )
    const trigger = screen.getByRole('button', { name: 'Chat model' })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByRole('option', { name: 'First' })).toHaveFocus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(change).toHaveBeenCalledExactlyOnceWith('second')
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
    expect(change).toHaveBeenCalledOnce()
  })
})
