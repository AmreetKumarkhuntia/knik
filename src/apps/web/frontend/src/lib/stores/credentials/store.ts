import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { CredentialsState } from '$types/stores/credentials'
import { createCredentialsActions } from './actions'
export function createCredentialsStore(seed: DemoSnapshot) {
  return createStore<CredentialsState>()((set, get) => ({
    apiKeys: structuredClone(seed.apiKeys),
    keyScenarios: structuredClone(seed.keyScenarios),
    scopes: {},
    ...createCredentialsActions(set, get),
  }))
}
