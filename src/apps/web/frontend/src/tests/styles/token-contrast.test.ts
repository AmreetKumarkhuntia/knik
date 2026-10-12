import { describe, expect, it } from 'vitest'
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

  // Solid danger/info fills (badges, confirm buttons) carry --fg-inverse text, not white.
  it.each(['--danger', '--info'])('--fg-inverse reaches 4.5:1 on a solid %s fill', fill => {
    expect(contrast(color('--fg-inverse'), color(fill))).toBeGreaterThanOrEqual(4.5)
  })

  // Selected options and rows (command palette, sidebar recents, tabs) pair these two tokens.
  it.each(surfaces)('--acc-text reaches 4.5:1 on --acc-soft over %s', surface => {
    const selected = composite(color('--acc-soft'), color(surface))
    expect(contrast(color('--acc-text'), selected)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['--bg-base', ...surfaces])('--border-3 reaches 3:1 against %s', surface => {
    expect(contrast(color('--border-3'), color(surface))).toBeGreaterThanOrEqual(3)
  })
})

it('rejects token formats the contrast check cannot evaluate', () => {
  expect(() => tokenColor(new Map([['--x', 'oklch(0.7 0.1 180)']]), '--x')).toThrow(
    'Unsupported color format'
  )
})

const librarySources = import.meta.glob<string>('../../lib/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

it('pairs solid danger/info fills with --fg-inverse text instead of white', () => {
  const classStrings = Object.entries(librarySources).flatMap(([file, code]) =>
    (code.match(/['"`][^'"`]*bg-\[var\(--(?:danger|info)\)\][^'"`]*['"`]/g) ?? []).map(
      classes => `${file.replace('../../', 'src/')}: ${classes}`
    )
  )
  expect(
    classStrings.filter(classes =>
      /\btext-white\b|\btext-\[(?:white|#fff|#ffffff)\]/i.test(classes)
    )
  ).toEqual([])
})
