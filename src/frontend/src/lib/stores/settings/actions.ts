import type {
  RemoteSettings,
  SettingsScope,
  SettingsState,
  SettingsStore,
} from '$types/stores/settings'
import { scopeSlice } from '../session/scopes'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export function createSettingsActions(set: SettingsStore['setState']) {
  const scopes = scopeSlice<SettingsState, SettingsScope>(set)
  return {
    initializeScope: (id: string) => scopes.init(id, { ...EMPTY_SETTINGS_SCOPE, draft: {} }),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    setRemote: (patch: Partial<RemoteSettings>) =>
      set(state => ({ remote: { ...state.remote, ...patch } })),
    updateSettings: (patch: Partial<SettingsState['settings']>) =>
      set(state => ({ settings: { ...state.settings, ...patch } })),
    updateAppearance: (patch: Partial<SettingsState['appearance']>) =>
      set(state => ({ appearance: { mode: patch.mode ?? state.appearance.mode } })),
    toggleTool: (name: string, enabled: boolean) =>
      set(state => ({ enabledTools: { ...state.enabledTools, [name]: enabled } })),
  }
}
