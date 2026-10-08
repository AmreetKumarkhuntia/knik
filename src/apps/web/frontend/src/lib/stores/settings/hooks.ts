import { useCallback } from 'react'
import { useStore } from 'zustand'
import type { SettingsState } from '$types/stores/settings'
import { useStoreBundle } from '../session/useStoreBundle'
import { useWidgetScope } from '../session/useWidgetScope'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export function useSettingsStore<T>(selector: (state: SettingsState) => T): T {
  return useStore(useStoreBundle().settings, selector)
}
export function useSettingsScope() {
  const initialize = useSettingsStore(s => s.initializeScope),
    dispose = useSettingsStore(s => s.disposeScope)
  const scopeId = useWidgetScope(initialize, dispose)
  const scope = useSettingsStore(s => s.scopes[scopeId] ?? EMPTY_SETTINGS_SCOPE),
    patch = useSettingsStore(s => s.patchScope)
  const patchScoped = useCallback(
    (change: Partial<typeof scope>) => patch(scopeId, change),
    [patch, scopeId]
  )
  return { scopeId, scope, patch: patchScoped }
}
