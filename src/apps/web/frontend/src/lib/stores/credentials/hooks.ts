import { useCallback } from 'react'
import { useStore } from 'zustand'
import type { CredentialsState } from '$types/stores/credentials'
import { useStoreBundle } from '../session/useStoreBundle'
import { useWidgetScope } from '../session/useWidgetScope'
import { EMPTY_CREDENTIALS_SCOPE } from './selectors'
export function useCredentialsStore<T>(selector: (state: CredentialsState) => T): T {
  return useStore(useStoreBundle().credentials, selector)
}
export function useCredentialsScope() {
  const initialize = useCredentialsStore(s => s.initializeScope),
    dispose = useCredentialsStore(s => s.disposeScope)
  const scopeId = useWidgetScope(initialize, dispose)
  const scope = useCredentialsStore(s => s.scopes[scopeId] ?? EMPTY_CREDENTIALS_SCOPE),
    patch = useCredentialsStore(s => s.patchScope)
  const patchScoped = useCallback(
    (change: Partial<typeof scope>) => patch(scopeId, change),
    [patch, scopeId]
  )
  return { scopeId, scope, patch: patchScoped }
}
