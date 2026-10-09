import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StoresProvider } from '$stores'
import { useFeedbackStore } from '$stores/feedback'
import { useCopyToClipboard } from '$widgets/feedback/useCopyToClipboard'

const librarySources = import.meta.glob<string>('../../../lib/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <StoresProvider source={{}}>{children}</StoresProvider>
)

function stubClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText && { writeText },
  })
}

function renderCopy(successMessage?: string) {
  return renderHook(
    () => ({
      copy: useCopyToClipboard(successMessage),
      toasts: useFeedbackStore(state => state.toasts),
    }),
    { wrapper }
  )
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
})

describe('useCopyToClipboard', () => {
  it('writes the text and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    const { result } = renderCopy()
    result.current.copy('hello')
    expect(writeText).toHaveBeenCalledWith('hello')
    await waitFor(() =>
      expect(result.current.toasts).toEqual([
        { id: 1, message: 'Copied to clipboard.', type: 'success' },
      ])
    )
  })

  it('uses a caller-specific success message', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined))
    const { result } = renderCopy('Demo key copied.')
    result.current.copy('secret')
    await waitFor(() =>
      expect(result.current.toasts.map(toast => toast.message)).toEqual(['Demo key copied.'])
    )
  })

  it('reports a rejected write as an error', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')))
    const { result } = renderCopy()
    result.current.copy('hello')
    await waitFor(() =>
      expect(result.current.toasts).toEqual([
        { id: 1, message: 'Could not copy to the clipboard.', type: 'error' },
      ])
    )
  })

  it('reports a missing clipboard (insecure context) without throwing', () => {
    stubClipboard()
    const { result } = renderCopy()
    expect(() => act(() => result.current.copy('hello'))).not.toThrow()
    expect(result.current.toasts).toEqual([
      { id: 1, message: 'Clipboard is unavailable in this browser.', type: 'error' },
    ])
  })

  it('keeps the callback stable across renders', () => {
    const { result, rerender } = renderCopy()
    const first = result.current.copy
    rerender()
    expect(result.current.copy).toBe(first)
  })

  it('is the only clipboard writer in the app', () => {
    const writers = Object.entries(librarySources)
      .filter(([, code]) => /navigator\.clipboard|['"]clipboard['"]/.test(code))
      .map(([file]) => file.replace('../../../', 'src/'))
    expect(writers).toEqual(['src/lib/widgets/feedback/useCopyToClipboard.ts'])
  })
})
