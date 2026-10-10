import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToolCallCard from '$components/chat/ToolCallCard'
import type { ToolCall } from '$types/conversation'

const call: ToolCall = {
  id: 'call-1',
  tool_name: 'read_file',
  tool_args: { path: 'pipeline.py' },
  tool_result: { lines: 142 },
  duration_ms: 900,
}

const toggle = () => screen.getByRole('button', { name: /read_file/ })

describe('ToolCallCard', () => {
  it.each([
    ['tool', 'Tool', 'build'],
    ['skill', 'Skill', 'auto_awesome'],
    ['mcp', 'MCP', 'hub'],
  ] as const)('labels a %s call and hides its icons from assistive tech', (kind, label, icon) => {
    const { container } = render(<ToolCallCard call={{ ...call, kind }} />)
    expect(within(toggle()).getByText(label)).toBeInTheDocument()
    const icons = [...container.querySelectorAll('.material-symbols-outlined')]
    expect(icons.map(node => node.textContent)).toContain(icon)
    for (const node of icons) expect(node).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows a spinner and shimmering name while running, without a duration', () => {
    const { container } = render(<ToolCallCard call={{ ...call, status: 'running' }} />)
    expect(toggle()).toHaveAccessibleName(/Running/)
    expect(container.querySelector('.knik-spinner')).toBeInTheDocument()
    expect(screen.getByText('read_file')).toHaveClass('knik-shimmer-text')
    expect(screen.queryByText('0.9s')).not.toBeInTheDocument()
  })

  it('collapses a finished call and expands it to show outputs and inputs', async () => {
    const user = userEvent.setup()
    render(<ToolCallCard call={call} />)
    expect(toggle()).toHaveAccessibleName(/Done/)
    expect(screen.getByText('0.9s')).toBeInTheDocument()
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    const body = document.getElementById(toggle().getAttribute('aria-controls') ?? '')
    expect(body).toHaveAttribute('aria-live', 'off')
    expect(screen.getByRole('tab', { name: 'Outputs' })).toHaveAttribute('aria-selected', 'true')
    expect(body).toHaveTextContent('142')
    await user.click(screen.getByRole('tab', { name: 'Inputs' }))
    expect(body).toHaveTextContent('pipeline.py')
  })

  it('renders a text result as plain text rather than a JSON string', async () => {
    const user = userEvent.setup()
    render(<ToolCallCard call={{ ...call, tool_result: '## Plan\n- step' }} />)
    await user.click(toggle())
    expect(screen.getByText(/## Plan/).tagName).toBe('PRE')
  })

  it('opens a failed call by default with its error and inputs', () => {
    render(
      <ToolCallCard
        call={{ ...call, status: 'error', error: '2 failed', tool_result: undefined }}
      />
    )
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(toggle()).toHaveAccessibleName(/Failed/)
    expect(screen.getByText('2 failed')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Inputs' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Outputs' })).not.toBeInTheDocument()
  })

  it('opens when a running call fails', () => {
    const view = render(<ToolCallCard call={{ ...call, status: 'running' }} />)
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    view.rerender(<ToolCallCard call={{ ...call, status: 'error', error: 'Stopped' }} />)
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
  })
})
