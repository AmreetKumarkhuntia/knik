import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentThinking from '$components/chat/AgentThinking'

describe('AgentThinking', () => {
  it('names the toggle by its visible label and hides icon ligatures from assistive tech', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AgentThinking steps={[{ type: 'tool_call', content: 'search_files' }]} />
    )
    const toggle = screen.getByRole('button', { name: 'Thinking trace' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Thinking trace' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByText('search_files')).toBeInTheDocument()
    expect(document.getElementById(toggle.getAttribute('aria-controls') ?? '')).toHaveAttribute(
      'aria-live',
      'off'
    )
    const icons = [...container.querySelectorAll('.material-symbols-outlined')]
    expect(icons.map(icon => icon.textContent)).toEqual(['unfold_less', 'expand_more', 'check'])
    for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})
