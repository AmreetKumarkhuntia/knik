import { expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Pagination from '$components/navigation/Pagination'

it('exposes the pager as navigation and marks the current page', () => {
  render(<Pagination currentPage={2} totalPages={3} onPageChange={vi.fn()} />)
  const pager = within(screen.getByRole('navigation', { name: 'Pagination' }))
  expect(pager.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  expect(pager.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current')
  expect(pager.getByRole('button', { name: '3' })).not.toHaveAttribute('aria-current')
})
