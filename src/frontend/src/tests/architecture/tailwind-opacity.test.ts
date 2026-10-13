import { describe, expect, it } from 'vitest'
import { tailwindConfig } from '../styles/helpers'

// Tailwind 3 cannot apply `/NN` opacity modifiers to colors defined as plain `var(--x)`
// strings (or to colors it does not know), and silently emits no CSS for those classes.
const sources = import.meta.glob<string>('../../lib/**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function varColorNames() {
  const names = new Set<string>()
  const colors = (tailwindConfig.theme?.extend?.colors ?? {}) as Record<
    string,
    string | Record<string, string>
  >
  for (const [key, value] of Object.entries(colors)) {
    const shades = typeof value === 'string' ? { DEFAULT: value } : value
    for (const [shade, color] of Object.entries(shades)) {
      if (color.includes('var(')) names.add(shade === 'DEFAULT' ? key : `${key}-${shade}`)
    }
  }
  return names
}

const COLOR_UTILITY =
  /^(?:[\w-]+:)*!?(?:bg|text|border(?:-[xytrbl])?|ring(?:-offset)?|divide|outline|fill|stroke|from|via|to|decoration|accent|caret|shadow|placeholder)-([a-z][\w-]*)\/(?:\d+|\[[^\]]+\])$/

// Colour names Tailwind does not know, so a `/NN` modifier on them emits nothing.
const semanticColors = [
  ...['foreground', 'text', 'secondary', 'subtle', 'textSecondary', 'primary'],
  ...['background', 'code', 'success', 'error', 'info'],
]
const unsupported = new Set([...varColorNames(), ...semanticColors, 'current', 'inherit'])

function violations(source: string) {
  return (source.match(/[^\s'"`{}()]+/g) ?? []).filter(token => {
    const match = COLOR_UTILITY.exec(token)
    return match !== null && unsupported.has(match[1])
  })
}

describe('Tailwind opacity modifiers', () => {
  it('derives the var-based theme colors from tailwind.config.js', () => {
    expect([...varColorNames()]).toEqual(expect.arrayContaining(['panel-2', 'border', 'surface-2']))
  })

  it('flags dropped modifiers and allows hex palette colors', () => {
    expect(
      violations(
        "'bg-panel-2/10 border-border/50 focus-visible:ring-primary/50 hover:bg-current/20 bg-emerald-500/15 bg-teal-200/10 bg-surface/50 bg-error/20 bg-black/50'"
      )
    ).toEqual([
      'bg-panel-2/10',
      'border-border/50',
      'focus-visible:ring-primary/50',
      'hover:bg-current/20',
      'bg-surface/50',
      'bg-error/20',
    ])
  })

  it('src/lib uses color-mix() instead of /NN on var-based colors', () => {
    const found = Object.entries(sources).flatMap(([file, source]) =>
      violations(source).map(token => `${file.replace('../../', 'src/')}: ${token}`)
    )
    expect(found).toEqual([])
  })
})
