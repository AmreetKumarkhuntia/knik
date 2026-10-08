import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VerticalTabs from '$components/navigation/VerticalTabs'

afterEach(() => vi.unstubAllGlobals())

describe('responsive settings navigation', () => {
  it('updates keyboard orientation when switching from a sidebar to horizontal tabs', async () => {
    vi.stubGlobal('innerWidth', 1024)
    const user = userEvent.setup()
    render(
      <VerticalTabs
        tabs={[
          { id: 'general', label: 'General', content: 'General content' },
          { id: 'appearance', label: 'Appearance', content: 'Appearance content' },
          { id: 'providers', label: 'Providers', content: 'Providers content' },
        ]}
      />
    )
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
    screen.getByRole('tab', { name: 'General' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Appearance content')

    act(() => {
      vi.stubGlobal('innerWidth', 390)
      window.dispatchEvent(new Event('resize'))
    })
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Providers' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'General' })).toHaveFocus()
  })
})
