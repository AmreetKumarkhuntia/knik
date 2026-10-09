import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StoresProvider } from '$stores'
import SidebarWidget from '$widgets/layout/SidebarWidget'

describe('SidebarWidget conversation edits', () => {
  it('discards cancelled titles and shares committed changes with the sidebar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <StoresProvider
          source={{
            conversations: [
              {
                id: 'conversation-one',
                title: 'Original conversation',
                messages: [],
                created_at: null,
                updated_at: null,
                summary_message_id: null,
                compacted_count: 0,
                total_tokens: 0,
              },
            ],
          }}
        >
          <SidebarWidget />
        </StoresProvider>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /^Rename/ }))
    await user.clear(screen.getByRole('textbox', { name: 'Title' }))
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Discarded title')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Original conversation')).toBeInTheDocument()
    expect(screen.queryByText('Discarded title')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Rename/ }))
    await user.clear(screen.getByRole('textbox', { name: 'Title' }))
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Saved title')
    await user.click(screen.getByRole('button', { name: 'Save title' }))
    expect(screen.getByText('Saved title')).toBeInTheDocument()
    expect(screen.queryByText('Original conversation')).not.toBeInTheDocument()
  })
})

describe('SidebarWidget active conversation', () => {
  const conversation = {
    id: 'conversation-one',
    title: 'Current conversation',
    messages: [],
    created_at: null,
    updated_at: null,
    summary_message_id: null,
    compacted_count: 0,
    total_tokens: 0,
  }
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <StoresProvider
          source={{ conversations: [conversation], activeConversationId: conversation.id }}
        >
          <SidebarWidget />
        </StoresProvider>
      </MemoryRouter>
    )

  it('marks the active conversation as current on the chat route', () => {
    renderAt('/')
    expect(screen.getByRole('button', { name: 'Current conversation' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })

  it('does not mark a conversation as current away from chat', () => {
    renderAt('/workflows')
    expect(screen.getByRole('button', { name: 'Current conversation' })).not.toHaveAttribute(
      'aria-current'
    )
  })
})
