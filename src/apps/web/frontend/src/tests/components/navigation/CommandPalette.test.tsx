import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommandPalette from '$components/navigation/CommandPalette'
import type { CommandGroup } from '$types'

const commands: CommandGroup[] = [
  { group: 'Actions', items: [{ id: 'new-chat', label: 'New chat', icon: 'add' }] },
  {
    group: 'Navigate',
    items: [
      { id: 'nav-workflows', label: 'Go to Workflows' },
      { id: 'nav-settings', label: 'Open Settings' },
    ],
  },
]

function renderPalette(groups = commands) {
  const onSelect = vi.fn()
  render(
    <CommandPalette
      open
      commands={groups}
      query=""
      onQueryChange={() => {}}
      onSelect={onSelect}
      onClose={() => {}}
    />
  )
  return onSelect
}

describe('CommandPalette', () => {
  it('exposes the arrow-key selection through the combobox and listbox pattern', async () => {
    const user = userEvent.setup()
    const onSelect = renderPalette()
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    const listbox = screen.getByRole('listbox', { name: 'Commands' })
    const options = within(listbox).getAllByRole('option')
    expect(options.map(option => option.textContent)).toEqual([
      'addNew chat',
      'Go to Workflows',
      'Open Settings',
    ])
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls', listbox.id)
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    input.focus()
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveClass('bg-[var(--acc-soft)]')
    expect(options[0]).not.toHaveClass('bg-[var(--acc-soft)]')

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(input).toHaveAttribute('aria-activedescendant', options[2].id)
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('nav-settings')
  })

  it('drops the active descendant when nothing matches', () => {
    renderPalette([])
    const input = screen.getByRole('combobox', { name: 'Search commands' })
    expect(input).not.toHaveAttribute('aria-activedescendant')
    expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No matching commands.')).toBeInTheDocument()
  })
})
