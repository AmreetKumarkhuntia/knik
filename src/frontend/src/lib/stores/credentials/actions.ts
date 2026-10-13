import type {
  CredentialsStore,
  CredentialsScope,
  CredentialsState,
} from '$types/stores/credentials'
import { scopeSlice } from '../session/scopes'
import { EMPTY_CREDENTIALS_SCOPE } from './selectors'
export function createCredentialsActions(set: CredentialsStore['setState']) {
  const scopes = scopeSlice<CredentialsState, CredentialsScope>(set)
  return {
    initializeScope: (id: string) => scopes.init(id, { ...EMPTY_CREDENTIALS_SCOPE }),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    deleteKey: (id: string) =>
      set(state => ({ apiKeys: state.apiKeys.filter(key => key.id !== id) })),
  }
}
