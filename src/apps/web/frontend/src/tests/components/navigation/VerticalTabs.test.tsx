import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import VerticalTabs from '$components/navigation/VerticalTabs'

const tabs = [
  { id: 'general', label: 'General', content: 'General content' },
  { id: 'appearance', label: 'Appearance', content: 'Appearance content' },
  { id: 'providers', label: 'Providers', content: 'Providers content' },
]

describe('responsive settings navigation', () => {
  it('updates keyboard orientation when its widget switches from a sidebar to horizontal tabs', async () => {
    const user = userEvent.setup()
    const view = render(<VerticalTabs tabs={tabs} />)
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
    screen.getByRole('tab', { name: 'General' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Appearance content')

    view.rerender(<VerticalTabs tabs={tabs} orientation="horizontal" />)
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Providers' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'General' })).toHaveFocus()
  })
})
