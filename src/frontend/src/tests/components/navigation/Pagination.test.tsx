import { expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from '$components/navigation/Pagination'

it('exposes the pager as navigation and marks the current page', () => {
  render(<Pagination currentPage={2} totalPages={3} onPageChange={vi.fn()} />)
  const pager = within(screen.getByRole('navigation', { name: 'Pagination' }))
  expect(pager.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  expect(pager.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current')
  expect(pager.getByRole('button', { name: '3' })).not.toHaveAttribute('aria-current')
})

it.each([
  [1, '1 2 ... 10'],
  [3, '1 2 3 4 ... 10'],
  [5, '1 ... 4 5 6 ... 10'],
  [8, '1 ... 7 8 9 10'],
  [10, '1 ... 9 10'],
])('collapses a long range around page %i', (currentPage, expected) => {
  const { container } = render(
    <Pagination currentPage={currentPage} totalPages={10} onPageChange={vi.fn()} />
  )
  const list = container.querySelector('.flex.gap-1')
  expect(Array.from(list?.children ?? [], node => node.textContent).join(' ')).toBe(expected)
})

it('steps to the neighbouring page and disables the ends', async () => {
  const onPageChange = vi.fn()
  const view = render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />)
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Next' }))
  expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2)
  view.rerender(<Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />)
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
})
