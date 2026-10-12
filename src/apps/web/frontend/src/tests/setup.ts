import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import './hooks/matchMedia'
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

// jsdom has no ResizeObserver; this one never reports, so only synchronous measurements apply.
// Assigned directly because unstubGlobals would undo vi.stubGlobal.
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
