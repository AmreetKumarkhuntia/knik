import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { CredentialsState } from '$types/stores/credentials'
import { createCredentialsActions } from './actions'
export function createCredentialsStore(seed: DemoSnapshot) {
  return createStore<CredentialsState>()(set => ({
    apiKeys: structuredClone(seed.apiKeys),
    scopes: {},
    ...createCredentialsActions(set),
  }))
}
