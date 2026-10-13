import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { StoresProvider } from '$stores'
import AppearancePane from '$widgets/settings/AppearancePane'

it('names the color mode group by its own hidden legend and describes it with the row hint', () => {
  render(
    <StoresProvider source={{ appearance: { mode: 'dark' } }}>
      <AppearancePane />
    </StoresProvider>
  )
  expect(screen.getAllByRole('group')).toHaveLength(1)
  const group = screen.getByRole('group', { name: 'Color mode' })
  expect(group.tagName).toBe('FIELDSET')
  expect(within(group).getByText('Color mode')).toHaveClass('sr-only')
  expect(group).toHaveAccessibleDescription('Changes last for this session')
  expect(within(group).getByRole('radio', { name: 'Dark' })).toBeChecked()
  expect(within(group).getByRole('radio', { name: 'Light' })).not.toBeChecked()
})
