import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useViewport } from '$hooks'
import { activeMediaSubscriptions } from './matchMedia'

const originalWidth = window.innerWidth
function resize(width: number) {
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    window.dispatchEvent(new Event('resize'))
  })
}
afterEach(() => resize(originalWidth))

describe('useViewport', () => {
  it.each([
    [390, 'mobile'],
    [767, 'mobile'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
  ])('reads %ipx as %s on the first render', (width, expected) => {
    resize(width)
    const seen: string[] = []
    renderHook(() => {
      const viewport = useViewport()
      seen.push(viewport)
      return viewport
    })
    expect(seen[0]).toBe(expected)
  })

  it('re-renders only when a breakpoint is crossed and unsubscribes on unmount', () => {
    resize(1440)
    let renders = 0
    const { result, unmount } = renderHook(() => {
      renders += 1
      return useViewport()
    })
    const settled = renders
    resize(1300)
    resize(1100)
    expect(renders).toBe(settled)
    resize(900)
    expect(result.current).toBe('tablet')
    resize(390)
    expect(result.current).toBe('mobile')
    expect(renders).toBe(settled + 2)
    unmount()
    expect(activeMediaSubscriptions()).toBe(0)
  })
})
