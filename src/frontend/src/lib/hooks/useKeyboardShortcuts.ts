import { useEffect, useLayoutEffect, useRef } from 'react'
import type { KeyboardShortcut } from '$types/hooks'

/** Registers keyboard shortcuts and cleans up on unmount. */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  // Callers pass inline arrays; reading them through a ref keeps one stable window listener.
  const latest = useRef(shortcuts)
  useLayoutEffect(() => {
    latest.current = shortcuts
  })
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Autofill and synthetic keydown events can arrive without a `key`.
      const key = (e.key as string | undefined)?.toLowerCase()
      if (!key) return
      for (const shortcut of latest.current) {
        const keyMatch = key === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey
        const altMatch = shortcut.altKey === undefined || e.altKey === shortcut.altKey
        const metaMatch = shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          e.preventDefault()
          shortcut.handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
