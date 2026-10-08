import { useCallback } from 'react'
import { useWidgetScope } from '../session/useWidgetScope'
import { EMPTY_SHELL_SCOPE } from './selectors'
import { useStore } from 'zustand'
import type { ShellState } from '$types/stores/shell'
import { useStoreBundle } from '../session/useStoreBundle'
export function useShellStore<T>(selector: (state: ShellState) => T): T {
  return useStore(useStoreBundle().shell, selector)
}

export function useShellScope() {
  const initialize = useShellStore(s => s.initializeScope),
    dispose = useShellStore(s => s.disposeScope)
  const scopeId = useWidgetScope(initialize, dispose)
  const scope = useShellStore(s => s.scopes[scopeId] ?? EMPTY_SHELL_SCOPE),
    patch = useShellStore(s => s.patchScope)
  const patchScoped = useCallback(
    (change: Partial<typeof scope>) => patch(scopeId, change),
    [patch, scopeId]
  )
  return { scopeId, scope, patch: patchScoped }
}
