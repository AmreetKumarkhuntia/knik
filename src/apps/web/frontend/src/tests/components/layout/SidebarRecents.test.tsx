import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SidebarRecents from '$components/layout/SidebarRecents'
import type { Conversation } from '$types/conversation'

function conversation(id: string, title: string | null): Conversation {
  return {
    id,
    title,
    messages: [],
    created_at: null,
    updated_at: null,
    summary_message_id: null,
    compacted_count: 0,
    total_tokens: 0,
  }
}

describe('SidebarRecents', () => {
  it('names per-row actions after their conversation and marks the current one', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    const onDelete = vi.fn()
    const first = conversation('first', 'Trip planning')
    const second = conversation('second', null)
    render(
      <SidebarRecents
        conversations={[first, second]}
        loading={false}
        activeConversationId="second"
        onSelect={() => {}}
        onRename={onRename}
        onDelete={onDelete}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Rename conversation Trip planning' }))
    expect(onRename).toHaveBeenCalledExactlyOnceWith(first)
    await user.click(screen.getByRole('button', { name: 'Delete conversation New chat' }))
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(second)
    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()

    const current = screen.getByRole('button', { current: true })
    expect(current).toHaveAttribute('aria-current', 'true')
    expect(current).toHaveTextContent('New chat')
    expect(
      screen.getByRole('button', { name: /^Trip planning/, current: false })
    ).toBeInTheDocument()
  })

  it('marks nothing as current without an active conversation', () => {
    render(
      <SidebarRecents
        conversations={[conversation('first', 'Trip planning')]}
        loading={false}
        onSelect={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.queryByRole('button', { current: true })).not.toBeInTheDocument()
  })
})
