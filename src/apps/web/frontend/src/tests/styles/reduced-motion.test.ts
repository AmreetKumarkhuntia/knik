import { expect, it } from 'vitest'
import { readSource } from './helpers'

it('collapses every CSS animation and transition when reduced motion is requested', () => {
  const css = readSource('styles/primitives.css')
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
  expect(start).toBeGreaterThan(-1)
  const block = css.slice(start, css.indexOf('\n}', start))
  expect(block).toMatch(/\*,\s*\*::before,\s*\*::after\s*\{/)
  for (const declaration of [
    'animation-duration: 0.01ms !important',
    'animation-iteration-count: 1 !important',
    'transition-duration: 0.01ms !important',
    'scroll-behavior: auto !important',
  ]) {
    expect(block).toContain(declaration)
  }
})
