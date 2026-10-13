import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Banner from '$components/surfaces/Banner'

describe('Banner live-region role', () => {
  it.each(['info', 'success'] as const)('announces %s banners politely', variant => {
    render(<Banner variant={variant}>Saved for this session.</Banner>)
    expect(screen.getByRole('status')).toHaveTextContent('Saved for this session.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('defaults to a polite info banner', () => {
    render(<Banner>Static note.</Banner>)
    expect(screen.getByRole('status')).toHaveTextContent('Static note.')
  })

  it.each(['danger', 'warning'] as const)('interrupts with %s banners', variant => {
    render(<Banner variant={variant}>Something needs attention.</Banner>)
    expect(screen.getByRole('alert')).toHaveTextContent('Something needs attention.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('Banner icon', () => {
  it.each([
    ['info', 'info'],
    ['success', 'check_circle'],
    ['warning', 'warning'],
    ['danger', 'error'],
  ] as const)('draws a hidden %s glyph by default', (variant, glyph) => {
    const { container } = render(<Banner variant={variant}>Note.</Banner>)
    const icon = container.querySelector('.material-symbols-outlined')
    expect(icon).toHaveTextContent(glyph)
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('prefers an explicit icon', () => {
    const { container } = render(<Banner icon={<span data-testid="custom" />}>Custom icon.</Banner>)
    expect(screen.getByTestId('custom')).toBeInTheDocument()
    expect(container.querySelector('.material-symbols-outlined')).toBeNull()
  })
})
