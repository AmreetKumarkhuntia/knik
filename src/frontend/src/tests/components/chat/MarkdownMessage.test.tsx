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

  it('keeps code blocks mounted when the copy handler changes and copies through the latest one', async () => {
    const user = userEvent.setup()
    const first = vi.fn()
    const latest = vi.fn()
    const markdown = '```ts\nconst ok = true\n```'
    const view = render(<MarkdownMessage content={markdown} onCopy={first} />)
    const block = screen.getByText('ts').parentElement
    view.rerender(<MarkdownMessage content={markdown} onCopy={latest} />)
    expect(screen.getByText('ts').parentElement).toBe(block)
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledExactlyOnceWith('const ok = true')
  })
})
