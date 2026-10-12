import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useViewport } from '$hooks'
import { activeMediaSubscriptions, resizeTo } from './matchMedia'

describe('useViewport', () => {
  it.each([
    [390, 'mobile'],
    [767, 'mobile'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
  ])('reads %ipx as %s on the first render', (width, expected) => {
    resizeTo(width)
    const seen: string[] = []
    renderHook(() => {
      const viewport = useViewport()
      seen.push(viewport)
      return viewport
    })
    expect(seen[0]).toBe(expected)
  })

  it('re-renders only when a breakpoint is crossed and unsubscribes on unmount', () => {
    resizeTo(1440)
    let renders = 0
    const { result, unmount } = renderHook(() => {
      renders += 1
      return useViewport()
    })
    const settled = renders
    resizeTo(1300)
    resizeTo(1100)
    expect(renders).toBe(settled)
    resizeTo(900)
    expect(result.current).toBe('tablet')
    resizeTo(390)
    expect(result.current).toBe('mobile')
    expect(renders).toBe(settled + 2)
    unmount()
    expect(activeMediaSubscriptions()).toBe(0)
  })
})
