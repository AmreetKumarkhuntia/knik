import type { StoreApi } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { ScopeState } from './scope'
export interface CredentialsScope {
  deletingId: string | null
}
export interface CredentialsState
  extends Pick<DemoSnapshot, 'apiKeys'>, ScopeState<CredentialsScope> {
  deleteKey: (id: string) => void
}
export type CredentialsStore = StoreApi<CredentialsState>
