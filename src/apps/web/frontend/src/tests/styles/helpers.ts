/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss from 'postcss'
import tailwindcss, { type Config } from 'tailwindcss'

export type Theme = 'dark' | 'light'
type Rgba = [number, number, number, number]

const srcDir = resolve(import.meta.dirname, '../..')

/** Reads a file relative to `src/`; Vitest returns CSS imports empty, so styles are read from disk. */
export const readSource = (path: string) => readFileSync(resolve(srcDir, path), 'utf8')

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

function ruleBody(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`Missing ${selector} block`)
  return css.slice(start, css.indexOf('\n}', start))
}

function declarations(block: string) {
  const vars = new Map<string, string>()
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(name, value.trim())
  }
  return vars
}

/** Custom properties in effect for a theme: `:root`, plus the light-mode overrides. */
export function themeTokens(theme: Theme) {
  const css = stripComments(readSource('styles/tokens.css'))
  const vars = declarations(ruleBody(css, ':root'))
  if (theme === 'light') {
    for (const [name, value] of declarations(ruleBody(css, "[data-theme='light']"))) {
      vars.set(name, value)
    }
  }
  return vars
}

export function tokenColor(vars: Map<string, string>, name: string): Rgba {
  const value = vars.get(name)
  if (!value) throw new Error(`Unknown token ${name}`)
  const ref = /^var\((--[\w-]+)\)$/.exec(value)
  if (ref) return tokenColor(vars, ref[1])
  const mix = /^color-mix\(in srgb, var\((--[\w-]+)\) (\d+(?:\.\d+)?)%, transparent\)$/.exec(value)
  if (mix) {
    const [r, g, b, a] = tokenColor(vars, mix[1])
    return [r, g, b, (a * Number(mix[2])) / 100]
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(value)
  if (hex) return [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as Rgba
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value)
  if (rgb) {
    const [r, g, b, a = 1] = rgb[1].split(',').map(Number)
    return [r, g, b, a]
  }
  throw new Error(`Unsupported color format for ${name}: ${value}`)
}

/** Flattens a translucent color onto an opaque backdrop. */
export function composite([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1]
}

function luminance([r, g, b]: Rgba) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.x contrast ratio between two opaque colors. */
export function contrast(a: Rgba, b: Rgba) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const configs = import.meta.glob<Config>('../../../tailwind.config.js', {
  eager: true,
  import: 'default',
})
export const tailwindConfig = Object.values(configs)[0]

function unescapeCss(value: string) {
  return value.replace(/\\([0-9a-fA-F]{1,6}) ?|\\(.)/g, (_, hex?: string, char?: string) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : (char ?? '')
  )
}

/** Class names that appear in the selectors of a stylesheet. */
export function selectorClasses(css: string) {
  const classes = new Set<string>()
  for (const [, selector] of stripComments(css).matchAll(/([^{}]+)\{/g)) {
    for (const [, name] of selector.matchAll(/\.((?:[\w-]|\\[0-9a-fA-F]{1,6} ?|\\[^\s])+)/g)) {
      classes.add(unescapeCss(name))
    }
  }
  return classes
}

const projectClasses = new Set(
  ['styles/primitives.css', 'styles/graph.css', 'index.css'].flatMap(path => [
    ...selectorClasses(readSource(path)),
  ])
)

/** Returns the classes that neither Tailwind (with the project config) nor the project CSS defines. */
export async function unresolvedClasses(classNames: Iterable<string>) {
  const candidates = [...new Set(classNames)].filter(Boolean)
  const content = [{ raw: `<div class="${candidates.join(' ')}"></div>`, extension: 'html' }]
  const { css } = await postcss([tailwindcss({ ...tailwindConfig, content })]).process(
    '@tailwind utilities;',
    { from: undefined }
  )
  const generated = selectorClasses(css)
  return candidates.filter(name => !generated.has(name) && !projectClasses.has(name))
}

/** Every class token rendered inside a container, including SVG elements. */
export function renderedClasses(container: Element) {
  return [...container.querySelectorAll('[class]')].flatMap(element =>
    (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  )
}
