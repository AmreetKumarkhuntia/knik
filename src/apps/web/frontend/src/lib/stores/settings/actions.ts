import type { SettingsStore, SettingsScope, SettingsState } from '$types/stores/settings'
import { scopeSlice } from '../session/scopes'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export function createSettingsActions(
  set: SettingsStore['setState'],
  get: SettingsStore['getState']
) {
  const scopes = scopeSlice<SettingsState, SettingsScope>(set)
  const savedProfile = () => ({
    displayName: get().settings.display_name ?? '',
    username: get().settings.username ?? '',
  })
  return {
    initializeScope: (id: string) =>
      scopes.init(id, { ...EMPTY_SETTINGS_SCOPE, ...savedProfile() }),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    updateSettings: (patch: Partial<SettingsState['settings']>) =>
      set(state => ({ settings: { ...state.settings, ...patch } })),
    updateAppearance: (patch: Partial<SettingsState['appearance']>) =>
      set(state => ({ appearance: { mode: patch.mode ?? state.appearance.mode } })),
    toggleTool: (name: string, enabled: boolean) =>
      set(state => ({ enabledTools: { ...state.enabledTools, [name]: enabled } })),
    resetProfile: (scopeId: string) => scopes.patch(scopeId, savedProfile()),
    saveProfile: (scopeId: string) => {
      const scope = get().scopes[scopeId]
      if (!scope) return { ok: false as const, error: 'Profile editor is unavailable.' }
      const displayName = scope.displayName.trim(),
        username = scope.username.trim()
      get().updateSettings({ display_name: displayName, username })
      scopes.patch(scopeId, { displayName, username })
      return { ok: true as const }
    },
  }
}
