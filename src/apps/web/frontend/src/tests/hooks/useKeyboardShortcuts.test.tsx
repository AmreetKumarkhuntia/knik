import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from '$hooks'

describe('useKeyboardShortcuts', () => {
  it('keeps one listener across renders with inline bindings and calls the latest handler', () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ handler }) => useKeyboardShortcuts([{ key: 'j', ctrlKey: true, handler }]),
      { initialProps: { handler: first } }
    )
    rerender({ handler: latest })
    rerender({ handler: latest })
    expect(addListener.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)

    expect(fireEvent.keyDown(window, { key: 'J', ctrlKey: true })).toBe(false)
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledTimes(1)

    unmount()
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true })
    expect(latest).toHaveBeenCalledTimes(1)
  })

  it('ignores chords whose required modifiers are missing', () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: 'k', metaKey: true, handler }]))
    expect(fireEvent.keyDown(window, { key: 'k' })).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'k', metaKey: true, shiftKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores keydown events without a key, such as those dispatched by autofill', () => {
    const handler = vi.fn()
    const errors = vi.fn((event: ErrorEvent) => event.preventDefault())
    window.addEventListener('error', errors)
    renderHook(() => useKeyboardShortcuts([{ key: 'k', handler }]))
    window.dispatchEvent(new Event('keydown'))
    window.removeEventListener('error', errors)
    expect(errors).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })
})
