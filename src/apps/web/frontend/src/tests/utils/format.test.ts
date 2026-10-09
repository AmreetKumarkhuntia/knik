import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatDuration, formatRelativeDay, formatTime } from '$utils/format'

const local = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 9, 8, 0))
})
afterEach(() => vi.useRealTimers())

describe('formatDuration', () => {
  it.each([
    [undefined, '-'],
    [0, '-'],
    [250, '250ms'],
    [1500, '1.5s'],
    [59_000, '59.0s'],
    [90_000, '1.5m'],
  ])('formats %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('returns a dash without a date and the locale string otherwise', () => {
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
    const iso = local(9, 7, 30)
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleString())
  })
})

describe('formatTime', () => {
  it('returns hours and minutes, or an empty string for missing and invalid input', () => {
    const iso = local(9, 7, 30)
    expect(formatTime(iso)).toBe(
      new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
    expect(formatTime(null)).toBe('')
    expect(formatTime(undefined)).toBe('')
    expect(formatTime('not a date')).toBe('')
  })
})

describe('formatRelativeDay', () => {
  it('buckets by local calendar day rather than elapsed 24-hour windows', () => {
    expect(formatRelativeDay(local(9, 0, 1))).toBe('Today')
    expect(formatRelativeDay(local(8, 23))).toBe('Yesterday')
    expect(formatRelativeDay(local(8, 0, 1))).toBe('Yesterday')
    expect(formatRelativeDay(local(7, 9))).toBe('Oct 7')
  })

  it('treats timestamps slightly in the future as today', () => {
    expect(formatRelativeDay(new Date(Date.now() + 5 * 60 * 1000).toISOString())).toBe('Today')
    vi.setSystemTime(new Date(2026, 9, 9, 23, 58))
    expect(formatRelativeDay(local(10, 0, 1))).toBe('Today')
    expect(formatRelativeDay(local(11, 9))).toBe('Oct 11')
  })

  it('returns an empty string for missing and invalid timestamps', () => {
    expect(formatRelativeDay(null)).toBe('')
    expect(formatRelativeDay('')).toBe('')
    expect(formatRelativeDay('not a date')).toBe('')
  })
})
