import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToolCallList from '$components/chat/ToolCallList'
import type { ToolCall } from '$types/conversation'

const make = (id: string, kind: ToolCall['kind']): ToolCall => ({
  id,
  kind,
  tool_name: `call_${id}`,
  tool_args: {},
})

describe('ToolCallList', () => {
  it('shows fewer than three calls directly', () => {
    render(<ToolCallList calls={[make('a', 'tool'), make('b', 'skill')]} />)
    expect(screen.getByRole('button', { name: /call_a/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Used/ })).not.toBeInTheDocument()
  })

  it('folds three or more finished calls into a summary counted by kind', async () => {
    const user = userEvent.setup()
    render(
      <ToolCallList
        calls={[make('a', 'tool'), make('b', 'tool'), make('c', 'skill'), make('d', 'mcp')]}
      />
    )
    const summary = screen.getByRole('button', { name: 'Used 2 tools · 1 skill · 1 MCP call' })
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: /call_a/ })).not.toBeInTheDocument()
    await user.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /call_d/ })).toBeInTheDocument()
  })

  it('keeps every card visible while the reply streams', () => {
    render(
      <ToolCallList calls={[make('a', 'tool'), make('b', 'tool'), make('c', 'tool')]} isStreaming />
    )
    expect(screen.queryByRole('button', { name: /Used/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /call_/ })).toHaveLength(3)
  })
})
