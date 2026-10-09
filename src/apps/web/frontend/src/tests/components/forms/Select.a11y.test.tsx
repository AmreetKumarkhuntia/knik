import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from '$components/forms/Select'

const options = [
  { value: 'gpt', label: 'GPT-4o' },
  { value: 'claude', label: 'Claude' },
]

function ModelChoice() {
  const [value, setValue] = useState('gpt')
  return (
    <Select
      presentation="rich"
      aria-label="Chat model"
      value={value}
      onValueChange={setValue}
      options={options}
    />
  )
}

describe('rich Select accessible name', () => {
  it('announces both the label and the selected value', async () => {
    const user = userEvent.setup()
    render(<ModelChoice />)
    const trigger = screen.getByRole('button', { name: 'Chat model GPT-4o' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Claude' }))
    expect(trigger).toHaveAccessibleName('Chat model Claude')
    expect(screen.getByRole('button', { name: /Chat model/ })).toBe(trigger)
  })

  it('draws the caret with a hidden Material Symbols icon', () => {
    render(<ModelChoice />)
    const trigger = screen.getByRole('button', { name: 'Chat model GPT-4o' })
    expect(trigger.lastElementChild).toHaveTextContent(/^expand_more$/)
    expect(trigger.lastElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('appends the value to an external label and to the placeholder fallback', () => {
    const view = render(
      <>
        <span id="provider-label">Provider</span>
        <Select
          presentation="rich"
          aria-labelledby="provider-label"
          value="gpt"
          options={options}
        />
      </>
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Provider GPT-4o')
    view.rerender(
      <Select
        presentation="rich"
        aria-label="Chat model"
        value=""
        placeholder="No models available"
        options={[]}
      />
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Chat model No models available')
  })
})
