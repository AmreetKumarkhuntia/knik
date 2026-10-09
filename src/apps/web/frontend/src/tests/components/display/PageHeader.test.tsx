import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageHeader from '$components/display/PageHeader'

describe('PageHeader breadcrumb trail', () => {
  it('names the back button and hides icon ligatures', async () => {
    const user = userEvent.setup()
    const onBackClick = vi.fn()
    render(
      <PageHeader breadcrumbs={['Workflows', 'Builder']} showBackButton onBackClick={onBackClick} />
    )
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBackClick).toHaveBeenCalledOnce()
    expect(screen.getByText('arrow_back')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('chevron_right')).toHaveAttribute('aria-hidden', 'true')
  })
})
