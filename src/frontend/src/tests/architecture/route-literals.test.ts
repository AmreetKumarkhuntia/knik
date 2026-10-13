import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>(['../../lib/**/*.{ts,tsx}', '../../App.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Route patterns and builders live in constants/navigation; everything else goes through them.
const ROUTE_LITERAL = /['"`]\/(?:workflows|executions|schedules|settings)\b/

describe('route literals', () => {
  it('detects a hard-coded application path', () => {
    expect(ROUTE_LITERAL.test('navigate(`/executions/${id}`)')).toBe(true)
    expect(ROUTE_LITERAL.test('<Link to="/workflows/create">')).toBe(true)
    expect(ROUTE_LITERAL.test('navigate(ROUTES.workflows)')).toBe(false)
  })

  it('builds every application path from ROUTES', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !file.endsWith('/constants/navigation.ts'))
      .flatMap(([file, code]) =>
        code
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => ROUTE_LITERAL.test(line))
          .map(({ index }) => `${file.replace('../../', 'src/')}:${index + 1}`)
      )
    expect(Object.keys(sources).length).toBeGreaterThan(50)
    expect(offenders).toEqual([])
  })
})
