import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Checkbox from '$components/forms/Checkbox'
import ToggleSwitch from '$components/forms/ToggleSwitch'
import { contrast, readSource, themeTokens, tokenColor, type Theme } from './helpers'

const themes: Theme[] = ['dark', 'light']
const backdrops = ['--bg-base', '--bg-surface', '--bg-surface-2']

function tokenIn(
  classNames: string,
  utility: 'bg' | 'border' | 'peer-checked:bg' | 'peer-checked:after:bg'
) {
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

  // The thumb's position is the only on/off cue, so the thumb must stand out from the lit track.
  it('checked toggle thumb on its track', () => {
    render(<ToggleSwitch aria-label="Stream" checked onChange={() => {}} />)
    const classes = screen.getByRole('switch').nextElementSibling?.getAttribute('class') ?? ''
    const track = tokenIn(classes, 'peer-checked:bg')
    const thumb = tokenIn(classes, 'peer-checked:after:bg')
    for (const theme of themes) {
      const vars = themeTokens(theme)
      const ratio = contrast(tokenColor(vars, thumb), tokenColor(vars, track))
      expect(ratio, `${thumb} on ${track} (${theme})`).toBeGreaterThanOrEqual(3)
    }
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

  // A translucent halo alone barely changes a focused field, so the first ring must be solid.
  it('text input focus ring', () => {
    const rule = /\.knik-input:focus\s*\{([^}]*)\}/.exec(readSource('styles/primitives.css'))
    const ring = /box-shadow:\s*0 0 0 \d+px var\((--[\w-]+)\)/.exec(rule?.[1] ?? '')
    expect(ring).not.toBeNull()
    expectBoundary(ring?.[1] ?? '')
  })
})
