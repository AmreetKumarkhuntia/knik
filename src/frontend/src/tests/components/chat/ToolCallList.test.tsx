import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToolCallList from '$components/chat/ToolCallList'
import type { ToolCall } from '$types/conversation'

const make = (id: string, kind: ToolCall['kind'], status?: ToolCall['status']): ToolCall => ({
  id,
  kind,
  status,
  tool_name: `call_${id}`,
  tool_args: {},
})

describe('ToolCallList', () => {
  it('folds finished calls behind a summary counted by kind', async () => {
    const user = userEvent.setup()
    render(
      <ToolCallList
        calls={[make('a', 'tool'), make('b', 'tool'), make('c', 'skill'), make('d', 'mcp')]}
      />
    )
    const summary = screen.getByRole('button', { name: /Used 2 tools · 1 skill · 1 MCP call/ })
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: /call_a/ })).not.toBeInTheDocument()
    await user.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('button', { name: /call_d/ })).toBeInTheDocument()
  })

  it('names the running call, and says Thinking between calls', () => {
    const { rerender } = render(
      <ToolCallList
        calls={[make('a', 'tool', 'success'), make('b', 'skill', 'running')]}
        isThinking
      />
    )
    expect(screen.getByRole('button', { name: /Running call_b…/ })).toBeInTheDocument()
    rerender(
      <ToolCallList
        calls={[make('a', 'tool', 'success'), make('b', 'skill', 'success')]}
        isThinking
      />
    )
    expect(screen.getByRole('button', { name: /Thinking…/ })).toBeInTheDocument()
  })

  it('shows Thinking before any call and nothing once a call-free reply answers', () => {
    const { rerender } = render(<ToolCallList calls={[]} isThinking />)
    expect(screen.getByText('Thinking…')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    rerender(<ToolCallList calls={[]} />)
    expect(screen.queryByText('Thinking…')).not.toBeInTheDocument()
  })

  it('counts failed calls in the summary', () => {
    render(<ToolCallList calls={[make('a', 'tool', 'error'), make('b', 'tool')]} />)
    expect(screen.getByRole('button', { name: /Used 2 tools\s*· 1 failed/ })).toBeInTheDocument()
  })
})
