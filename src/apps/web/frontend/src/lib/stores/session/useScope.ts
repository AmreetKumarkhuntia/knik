import { useCallback } from 'react'
import type { ScopeState } from '$types/stores/scope'
import { useWidgetScope } from './useWidgetScope'

/** Binds a widget to its own scope in a scoped store; `init` extends the scope's identity and init call. */
export function useScope<T, Init extends unknown[] = []>(
  useStoreState: <R>(selector: (state: ScopeState<T, Init>) => R) => R,
  empty: T,
  ...init: Init
) {
  const initialize = useStoreState(s => s.initializeScope),
    dispose = useStoreState(s => s.disposeScope),
    patch = useStoreState(s => s.patchScope)
  const scopeId = useWidgetScope(id => initialize(id, ...init), dispose, init.join())
  const scope = useStoreState(s => s.scopes[scopeId] ?? empty)
  const patchScoped = useCallback((change: Partial<T>) => patch(scopeId, change), [patch, scopeId])
  return { scopeId, scope, patch: patchScoped }
}
