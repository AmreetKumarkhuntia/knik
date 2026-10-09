import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Checkbox from '$components/forms/Checkbox'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import { contrast, readSource, themeTokens, tokenColor, type Theme } from './helpers'

const themes: Theme[] = ['dark', 'light']
const backdrops = ['--bg-base', '--bg-surface', '--bg-surface-2']

function tokenIn(classNames: string, utility: 'bg' | 'border') {
  const match = new RegExp(`(?:^|\\s)${utility}-\\[var\\((--[\\w-]+)\\)\\]`).exec(classNames)
  if (!match) throw new Error(`No ${utility} token in "${classNames}"`)
  return match[1]
}

function expectBoundary(token: string) {
  for (const theme of themes) {
    const vars = themeTokens(theme)
    for (const backdrop of backdrops) {
      const ratio = contrast(tokenColor(vars, token), tokenColor(vars, backdrop))
      expect(ratio, `${token} on ${backdrop} (${theme})`).toBeGreaterThanOrEqual(3)
    }
  }
}

describe('form control boundaries reach 3:1 non-text contrast', () => {
  it('unchecked toggle track', () => {
    render(<ToggleSwitch aria-label="Stream" checked={false} onChange={() => {}} />)
    const track = screen.getByRole('switch').nextElementSibling
    expectBoundary(tokenIn(track?.getAttribute('class') ?? '', 'bg'))
  })

  it('unchecked checkbox border', () => {
    render(<Checkbox label="Enabled" checked={false} onChange={() => {}} />)
    const box = screen.getByRole('checkbox').parentElement
    expectBoundary(tokenIn(box?.getAttribute('class') ?? '', 'border'))
  })

  it('text input border', () => {
    const rule = /\.knik-input\s*\{([^}]*)\}/.exec(readSource('styles/primitives.css'))
    const border = /border:\s*1px solid var\((--[\w-]+)\)/.exec(rule?.[1] ?? '')
    expect(border).not.toBeNull()
    expectBoundary(border?.[1] ?? '')
  })
})
