import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownMessage } from '$components/chat/MarkdownMessage'

describe('MarkdownMessage', () => {
  it('renders unlabelled fenced code through the shared copy event and semantic table', async () => {
    const user = userEvent.setup()
    const copy = vi.fn()
    const markdown = '```\nplain code\n```\n\n| Name | Value |\n| --- | --- |\n| A | 1 |'
    render(<MarkdownMessage content={markdown} onCopy={copy} />)
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(copy).toHaveBeenCalledExactlyOnceWith('plain code')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
  })
})
