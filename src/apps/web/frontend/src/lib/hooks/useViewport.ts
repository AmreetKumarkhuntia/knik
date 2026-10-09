import { useSyncExternalStore } from 'react'
import { BREAKPOINTS } from '$lib/constants/dimensions'
import type { Viewport } from '$types/stores/shell'

const TABLET_QUERY = `(min-width: ${BREAKPOINTS.tablet}px)`
const DESKTOP_QUERY = `(min-width: ${BREAKPOINTS.desktop}px)`

function subscribe(onChange: () => void) {
  const queries = [TABLET_QUERY, DESKTOP_QUERY].map(query => window.matchMedia(query))
  queries.forEach(query => query.addEventListener('change', onChange))
  return () => queries.forEach(query => query.removeEventListener('change', onChange))
}

function readViewport(): Viewport {
  if (window.matchMedia(DESKTOP_QUERY).matches) return 'desktop'
  return window.matchMedia(TABLET_QUERY).matches ? 'tablet' : 'mobile'
}

/**
 * Reads the breakpoint during render so the first frame already uses the right layout, and
 * re-renders only when a breakpoint is crossed.
 */
export function useViewport(): Viewport {
  return useSyncExternalStore(subscribe, readViewport)
}
