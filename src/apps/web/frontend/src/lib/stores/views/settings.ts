import { useMemo } from 'react'
import { useSettingsStore } from '../settings/hooks'
import { useCatalog } from '../catalogs/hooks'
import { useCredentialsStore } from '../credentials/hooks'
import { EMPTY_SETTINGS_SCOPE } from '../settings/selectors'
import { EMPTY_CREDENTIALS_SCOPE } from '../credentials/selectors'
export function useProfileView(scopeId: string) {
  const settings = useSettingsStore(s => s.settings)
  const scope = useSettingsStore(s => s.scopes[scopeId] ?? EMPTY_SETTINGS_SCOPE)
  const models = useCatalog('models')
  return {
    settings,
    dirty:
      scope.displayName !== (settings.display_name ?? '') ||
      scope.username !== (settings.username ?? ''),
    modelOptions: useMemo(
      () => models.map(model => ({ value: model.id, label: model.label })),
      [models]
    ),
  }
}
export function useProvidersView() {
  const providers = useCatalog('providers'),
    tools = useCatalog('tools')
  const provider = useSettingsStore(s => s.settings.provider),
    enabled = useSettingsStore(s => s.enabledTools)
  return {
    provider,
    providers: useMemo(
      () =>
        providers.map(option => ({
          value: option.id,
          label: option.name,
          monoLabel: option.id === provider ? 'Selected' : 'Available',
        })),
      [providers, provider]
    ),
    tools: useMemo(
      () => tools.map(tool => ({ ...tool, enabled: enabled[tool.name] ?? false })),
      [tools, enabled]
    ),
  }
}
export function useVoiceView() {
  const voices = useCatalog('voices'),
    voiceId = useSettingsStore(s => s.settings.voice)
  return { voices, selected: voices.find(voice => voice.id === voiceId) }
}
export function useCredentialsView(scopeId: string) {
  const keys = useCredentialsStore(s => s.apiKeys),
    scenarios = useCredentialsStore(s => s.keyScenarios),
    scope = useCredentialsStore(s => s.scopes[scopeId] ?? EMPTY_CREDENTIALS_SCOPE)
  return {
    keys,
    available: scenarios.some(scenario => !keys.some(key => key.id === scenario.id)),
    deleting: keys.find(key => key.id === scope.deletingId),
  }
}
