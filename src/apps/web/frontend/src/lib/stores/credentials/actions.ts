import type { CredentialsStore, CredentialsScope } from '$types/stores/credentials'
import { EMPTY_CREDENTIALS_SCOPE } from './selectors'
export function createCredentialsActions(
  set: CredentialsStore['setState'],
  get: CredentialsStore['getState']
) {
  return {
    initializeScope: (id: string) =>
      set(state => ({ scopes: { ...state.scopes, [id]: { ...EMPTY_CREDENTIALS_SCOPE } } })),
    disposeScope: (id: string) =>
      set(state => {
        const scopes = { ...state.scopes }
        delete scopes[id]
        return { scopes }
      }),
    patchScope: (id: string, patch: Partial<CredentialsScope>) =>
      set(state =>
        state.scopes[id]
          ? { scopes: { ...state.scopes, [id]: { ...state.scopes[id], ...patch } } }
          : {}
      ),
    closeEditor: (id: string) => get().patchScope(id, { creating: false, label: '', error: '' }),
    createDemoKey: (scopeId: string) => {
      const scope = get().scopes[scopeId],
        label = scope?.label.trim()
      const fail = (error: string) => {
        get().patchScope(scopeId, { error })
        return { ok: false as const, error }
      }
      if (!scope || !label) return fail('Enter a key name.')
      const scenario = get().keyScenarios.find(key => key.label === label)
      if (!scenario) return fail('No demo key is supplied for this label.')
      if (get().apiKeys.some(key => key.id === scenario.id))
        return fail('This demo key is already listed.')
      const { id, key_prefix, scopes } = scenario
      set(state => ({
        apiKeys: [
          ...state.apiKeys,
          { id, label, key_prefix, scopes: [...scopes], created_at: null, last_used_at: null },
        ],
        scopes: {
          ...state.scopes,
          [scopeId]: {
            ...scope,
            created: structuredClone(scenario),
            creating: false,
            label: '',
            error: '',
          },
        },
      }))
      return { ok: true as const, id }
    },
    deleteKey: (id: string) =>
      set(state => ({
        apiKeys: state.apiKeys.filter(key => key.id !== id),
        scopes: Object.fromEntries(
          Object.entries(state.scopes).map(([scopeId, scope]) => [
            scopeId,
            scope
              ? {
                  ...scope,
                  created: scope.created?.id === id ? null : scope.created,
                  deletingId: scope.deletingId === id ? null : scope.deletingId,
                }
              : undefined,
          ])
        ),
      })),
  }
}
