import { describe, expect, it } from 'vitest'
import { tailwindConfig } from '../styles/helpers'

// tailwind.config.js replaces Tailwind's font sizes with the type scale, so `text-sm` emits
// nothing; arbitrary `text-[13px]` still compiles and has to be caught here.
const sources = import.meta.glob<string>('../../lib/**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const OFF_SCALE =
  /^(?:[\w-]+:)*!?text-(?:xs|sm|base|lg|[2-9]?xl|\[(?:length:)?[\d.]+(?:px|rem|em)\])$/

function violations(source: string) {
  return (source.match(/[^\s'"`{}()]+/g) ?? []).filter(token => OFF_SCALE.test(token))
}

describe('Type scale', () => {
  it('exposes only the token sizes', () => {
    expect(Object.keys(tailwindConfig.theme?.fontSize ?? {})).toEqual(
      expect.arrayContaining(['micro', 'caption', 'label', 'body', 'body-lg', 'h1', 'mono'])
    )
    expect(tailwindConfig.theme?.extend?.fontSize).toBeUndefined()
  })

  it('flags default and arbitrary sizes but not colors', () => {
    expect(
      violations(
        "'text-sm md:text-xl text-[13px] text-[0.8rem] text-caption text-[var(--fg-3)] text-fg-2'"
      )
    ).toEqual(['text-sm', 'md:text-xl', 'text-[13px]', 'text-[0.8rem]'])
  })

  it('src/lib only uses type-scale sizes', () => {
    const found = Object.entries(sources).flatMap(([file, source]) =>
      violations(source).map(token => `${file.replace('../../', 'src/')}: ${token}`)
    )
    expect(found).toEqual([])
  })
})
