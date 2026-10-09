import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompactionDivider from '$components/chat/CompactionDivider'

describe('CompactionDivider', () => {
  it('uses hidden Material Symbols glyphs and reveals the summary on a tinted surface', async () => {
    const user = userEvent.setup()
    const { container } = render(<CompactionDivider summaryContent="Earlier **summary**" />)
    expect(container.querySelector('svg')).toBeNull()
    const icons = container.querySelectorAll('.material-symbols-outlined')
    expect([...icons].map(icon => [icon.textContent, icon.getAttribute('aria-hidden')])).toEqual([
      ['compress', 'true'],
      ['expand_more', 'true'],
    ])
    await user.click(screen.getByRole('button', { name: 'Expand summary' }))
    const summary = screen.getByText('summary').closest('div.mt-3')
    expect(summary).toHaveClass('bg-[color-mix(in_srgb,var(--bg-surface)_30%,transparent)]')
    expect(summary).toHaveAttribute('aria-live', 'off')
    expect(screen.getByRole('button', { name: 'Collapse summary' })).toBeInTheDocument()
  })
})
