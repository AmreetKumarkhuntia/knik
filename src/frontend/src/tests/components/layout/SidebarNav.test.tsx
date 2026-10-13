import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SidebarNav from '$components/layout/SidebarNav'
import SidebarAccount from '$components/layout/SidebarAccount'
import { ROUTES } from '$lib/constants/navigation'

describe('SidebarNav', () => {
  it('marks only the current route and draws its highlight behind the label', () => {
    render(
      <MemoryRouter>
        <SidebarNav collapsed={false} pathname={ROUTES.workflows} />
      </MemoryRouter>
    )
    const current = screen.getByRole('link', { current: 'page' })
    expect(current).toHaveTextContent('Workflows')
    const highlight = current.firstElementChild
    expect(highlight).toHaveAttribute('aria-hidden', 'true')
    expect(highlight).toHaveClass('absolute', 'bg-[var(--acc-soft)]')
    expect(screen.getByRole('link', { name: /Chat/ })).not.toHaveAttribute('aria-current')
  })

  it('names collapsed links by their label', () => {
    render(
      <MemoryRouter>
        <SidebarNav collapsed pathname={ROUTES.home} />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Workflows' })).toHaveAttribute('title', 'Workflows')
  })
})

describe('SidebarAccount', () => {
  it('tints the account row while settings is open', () => {
    const { rerender } = render(
      <MemoryRouter>
        <SidebarAccount collapsed={false} name="Ada" initials="A" />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /Ada/ })).not.toHaveAttribute('aria-current')
    rerender(
      <MemoryRouter>
        <SidebarAccount collapsed={false} name="Ada" initials="A" active />
      </MemoryRouter>
    )
    const account = screen.getByRole('link', { name: /Ada/ })
    expect(account).toHaveAttribute('aria-current', 'page')
    expect(account).toHaveClass('bg-[var(--acc-soft)]', 'px-2', 'text-fg-2')
  })
})
