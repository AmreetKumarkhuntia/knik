import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HistoryTable from '$components/workflows/HistoryTable'

describe('HistoryTable', () => {
  it('draws the empty-state icon from the Material Symbols font rather than an SVG icon set', () => {
    const { container } = render(
      <HistoryTable executions={[]} loading={false} onViewDetail={vi.fn()} />
    )
    expect(screen.getByText('No execution history yet')).toBeInTheDocument()
    const glyph = container.querySelector('.material-symbols-outlined')
    expect(glyph).toHaveTextContent('history')
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('names each row action after its execution so repeated View buttons stay distinct', () => {
    render(
      <HistoryTable
        executions={[
          {
            id: 9210,
            workflowId: 'wf-1',
            workflowName: 'Nightly digest',
            status: 'success',
            startedAt: '2026-10-08T12:00:00Z',
            durationMs: 1200,
          },
        ]}
        loading={false}
        onViewDetail={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'View execution #9210' })).toHaveTextContent('View')
  })
})
