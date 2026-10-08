import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { StoresProvider } from '$stores'
import ThemeWidget from '$widgets/theme/ThemeWidget'
import AppearancePane from '$widgets/settings/AppearancePane'

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.removeProperty('--acc')
})

describe('fixed theme application', () => {
  it('switches only data-theme, restores the previous theme, and reloads the seed', async () => {
    const root = document.documentElement
    root.setAttribute('data-theme', 'previous')
    root.style.setProperty('--acc', 'existing-value')
    const user = userEvent.setup()
    const first = render(
      <StoresProvider source={{ appearance: { mode: 'dark' } }}>
        <ThemeWidget>
          <AppearancePane />
        </ThemeWidget>
      </StoresProvider>
    )
    expect(root).toHaveAttribute('data-theme', 'dark')
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(root.style.getPropertyValue('--acc')).toBe('existing-value')
    first.unmount()
    expect(root).toHaveAttribute('data-theme', 'previous')

    render(
      <StoresProvider source={{}}>
        <ThemeWidget>
          <span>Reloaded</span>
        </ThemeWidget>
      </StoresProvider>
    )
    expect(root).toHaveAttribute('data-theme', 'dark')
  })
})
