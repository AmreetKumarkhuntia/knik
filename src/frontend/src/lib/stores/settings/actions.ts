import type {
  RemoteSettings,
  SettingsScope,
  SettingsState,
  SettingsStore,
} from '$types/stores/settings'
import { scopeSlice } from '../session/scopes'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export function createSettingsActions(
  set: SettingsStore['setState'],
  get: SettingsStore['getState']
) {
  const scopes = scopeSlice<SettingsState, SettingsScope>(set)
  return {
    initializeScope: (id: string) => scopes.init(id, { ...EMPTY_SETTINGS_SCOPE, draft: {} }),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    // A load that a later one overtook (a retry, a save's reload) must not land its stale result.
    startLoad: () => {
      set(state => ({
        remote: { ...state.remote, status: 'loading', loadId: state.remote.loadId + 1 },
      }))
      return get().remote.loadId
    },
    finishLoad: (loadId: number, patch: Partial<RemoteSettings>) =>
      set(state =>
        state.remote.loadId === loadId ? { remote: { ...state.remote, ...patch } } : state
      ),
    setRemote: (patch: Partial<RemoteSettings>) =>
      set(state => ({ remote: { ...state.remote, ...patch } })),
    // Reads the live draft, so edits made while a save or reset was in flight survive it.
    dropDraftKeys: (scopeId: string, keys: string[]) =>
      set(state => {
        const scope = state.scopes[scopeId]
        if (!scope) return state
        const draft = { ...scope.draft }
        for (const key of keys) delete draft[key]
        return { scopes: { ...state.scopes, [scopeId]: { ...scope, draft } } }
      }),
    updateSettings: (patch: Partial<SettingsState['settings']>) =>
      set(state => ({ settings: { ...state.settings, ...patch } })),
    updateAppearance: (patch: Partial<SettingsState['appearance']>) =>
      set(state => ({ appearance: { mode: patch.mode ?? state.appearance.mode } })),
    toggleTool: (name: string, enabled: boolean) =>
      set(state => ({ enabledTools: { ...state.enabledTools, [name]: enabled } })),
  }
}
