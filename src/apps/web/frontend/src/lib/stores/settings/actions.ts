import type { SettingsStore, SettingsScope, SettingsState } from '$types/stores/settings'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export function createSettingsActions(
  set: SettingsStore['setState'],
  get: SettingsStore['getState']
) {
  return {
    initializeScope: (id: string) =>
      set(state => ({
        scopes: {
          ...state.scopes,
          [id]: {
            ...EMPTY_SETTINGS_SCOPE,
            displayName: state.settings.display_name ?? '',
            username: state.settings.username ?? '',
          },
        },
      })),
    disposeScope: (id: string) =>
      set(state => {
        const scopes = { ...state.scopes }
        delete scopes[id]
        return { scopes }
      }),
    patchScope: (id: string, patch: Partial<SettingsScope>) =>
      set(state =>
        state.scopes[id]
          ? { scopes: { ...state.scopes, [id]: { ...state.scopes[id], ...patch } } }
          : {}
      ),
    updateSettings: (patch: Partial<SettingsState['settings']>) =>
      set(state => ({ settings: { ...state.settings, ...patch } })),
    updateAppearance: (patch: Partial<SettingsState['appearance']>) =>
      set(state => ({ appearance: { ...state.appearance, ...patch } })),
    toggleTool: (name: string, enabled: boolean) =>
      set(state => ({ enabledTools: { ...state.enabledTools, [name]: enabled } })),
    resetProfile: (scopeId: string) =>
      get().patchScope(scopeId, {
        displayName: get().settings.display_name ?? '',
        username: get().settings.username ?? '',
      }),
    saveProfile: (scopeId: string) => {
      const scope = get().scopes[scopeId]
      if (!scope) return { ok: false as const, error: 'Profile editor is unavailable.' }
      const displayName = scope.displayName.trim(),
        username = scope.username.trim()
      set(state => ({
        settings: { ...state.settings, display_name: displayName, username },
        scopes: { ...state.scopes, [scopeId]: { ...scope, displayName, username } },
      }))
      return { ok: true as const }
    },
  }
}
