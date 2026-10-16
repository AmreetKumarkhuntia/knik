import { useMemo } from 'react'
import { useSettingsStore } from '../settings/hooks'
import { useCatalog } from '../catalogs/hooks'
import { useCredentialsStore } from '../credentials/hooks'
import {
  EMPTY_SETTINGS_SCOPE,
  fieldValue,
  groupDefinitions,
  remoteChanges,
} from '../settings/selectors'
import { EMPTY_CREDENTIALS_SCOPE } from '../credentials/selectors'
export function useRemoteSettingsView(scopeId: string) {
  const remote = useSettingsStore(s => s.remote)
  const scope = useSettingsStore(s => s.scopes[scopeId] ?? EMPTY_SETTINGS_SCOPE)
  const groups = useMemo(() => groupDefinitions(remote.definitions), [remote.definitions])
  const values = useMemo(
    () =>
      Object.fromEntries(
        remote.definitions.map(field => [field.key, fieldValue(field, scope.draft)])
      ),
    [remote.definitions, scope.draft]
  )
  const { changes, errors } = useMemo(
    () => remoteChanges(remote.definitions, scope.draft),
    [remote.definitions, scope.draft]
  )
  return { ...remote, groups, values, draft: scope.draft, saving: scope.saving, changes, errors }
}
export function useProvidersView() {
  const tools = useCatalog('tools'),
    enabled = useSettingsStore(s => s.enabledTools)
  return {
    tools: useMemo(
      () => tools.map(tool => ({ ...tool, enabled: enabled[tool.name] ?? false })),
      [tools, enabled]
    ),
  }
}
export function useCredentialsView(scopeId: string) {
  const keys = useCredentialsStore(s => s.apiKeys),
    scope = useCredentialsStore(s => s.scopes[scopeId] ?? EMPTY_CREDENTIALS_SCOPE)
  return { keys, deleting: keys.find(key => key.id === scope.deletingId) }
}
