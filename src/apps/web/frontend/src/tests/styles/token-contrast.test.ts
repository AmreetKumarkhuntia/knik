import { describe, expect, it } from 'vitest'
import { EDGE_STATUS_COLORS } from '$lib/constants/themes'
import { composite, contrast, themeTokens, tokenColor, type Theme } from './helpers'

const themes: Theme[] = ['dark', 'light']
const statuses = ['success', 'warning', 'danger', 'info']
const surfaces = ['--bg-surface', '--bg-surface-2']

describe.each(themes)('%s theme tokens', theme => {
  const vars = themeTokens(theme)
  const color = (name: string) => tokenColor(vars, name)

  it.each(statuses.flatMap(status => surfaces.map(surface => [status, surface])))(
    '--%s text reaches 4.5:1 on %s, alone and over its badge tint',
    (status, surface) => {
      const text = color(`--${status}`)
      const backdrop = color(surface)
      const badge = composite(color(`--${status}-bg`), backdrop)
      expect(contrast(text, backdrop)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(text, badge)).toBeGreaterThanOrEqual(4.5)
    }
  )

  // Selected options and rows (command palette, sidebar recents, tabs) pair these two tokens.
  it.each(surfaces)('--acc-text reaches 4.5:1 on --acc-soft over %s', surface => {
    const selected = composite(color('--acc-soft'), color(surface))
    expect(contrast(color('--acc-text'), selected)).toBeGreaterThanOrEqual(4.5)
  })

  // Muted text on a selected row (palette shortcut, model vendor, active recent date).
  it.each(surfaces)('--acc-meta reaches 4.5:1 on --acc-soft over %s', surface => {
    const selected = composite(color('--acc-soft'), color(surface))
    expect(contrast(color('--acc-meta'), selected)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['--bg-base', ...surfaces])('--border-3 reaches 3:1 against %s', surface => {
    expect(contrast(color('--border-3'), color(surface))).toBeGreaterThanOrEqual(3)
  })

  it.each(Object.entries(EDGE_STATUS_COLORS))(
    'the %s graph edge reaches 3:1 on the canvas',
    (_, stroke) => {
      const edge = tokenColor(new Map([...vars, ['--edge', stroke]]), '--edge')
      const canvas = color('--bg-base')
      expect(contrast(composite(edge, canvas), canvas)).toBeGreaterThanOrEqual(3)
    }
  )

  describe('inside a glass card', () => {
    const card = composite(color('--panel'), color('--bg-base'))
    const hovered = composite(color('--row-hover'), card)
    const pill = (fill: string, row: typeof card) => composite(color(fill), row)
    const pills: [string, string][] = [
      ['--fg-2', '--panel-3'],
      ['--fg-2', '--panel-2'],
      ['--acc-text', '--acc-soft'],
      ['--success', '--success-bg'],
      ['--danger', '--danger-bg'],
    ]

    it('--fg-3 cells reach 4.5:1 on a hovered row', () => {
      expect(contrast(color('--fg-3'), hovered)).toBeGreaterThanOrEqual(4.5)
    })

    it.each(pills)('%s pill text reaches 4.5:1 on %s, resting and hovered', (text, fill) => {
      expect(contrast(color(text), pill(fill, card))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(color(text), pill(fill, hovered))).toBeGreaterThanOrEqual(4.5)
    })
  })
})

it('rejects token formats the contrast check cannot evaluate', () => {
  expect(() => tokenColor(new Map([['--x', 'oklch(0.7 0.1 180)']]), '--x')).toThrow(
    'Unsupported color format'
  )
})
