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
