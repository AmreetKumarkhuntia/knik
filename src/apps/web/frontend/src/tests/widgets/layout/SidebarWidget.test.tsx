import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DemoSessionProvider } from '$widgets/session/DemoSessionProvider'
import SidebarWidget from '$widgets/layout/SidebarWidget'

describe('SidebarWidget conversation edits', () => {
  it('discards cancelled titles and shares committed changes with the sidebar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <DemoSessionProvider
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
          <SidebarWidget onOpenSearch={() => {}} />
        </DemoSessionProvider>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    await user.clear(screen.getByRole('textbox', { name: 'Title' }))
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Discarded title')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Original conversation')).toBeInTheDocument()
    expect(screen.queryByText('Discarded title')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    await user.clear(screen.getByRole('textbox', { name: 'Title' }))
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Saved title')
    await user.click(screen.getByRole('button', { name: 'Save title' }))
    expect(screen.getByText('Saved title')).toBeInTheDocument()
    expect(screen.queryByText('Original conversation')).not.toBeInTheDocument()
  })
})
