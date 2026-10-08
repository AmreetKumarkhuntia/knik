import type { StoreApi } from 'zustand/vanilla'
import type { DemoSnapshot, DemoActionResult } from '$types/demo-session'
import type { ApiKeyCreated } from '$types/sections/settings'
export interface CredentialsScope {
  created: ApiKeyCreated | null
  creating: boolean
  label: string
  error: string
  deletingId: string | null
}
export interface CredentialsState extends Pick<DemoSnapshot, 'apiKeys' | 'keyScenarios'> {
  scopes: Partial<Record<string, CredentialsScope>>
  initializeScope: (id: string) => void
  disposeScope: (id: string) => void
  patchScope: (id: string, patch: Partial<CredentialsScope>) => void
  closeEditor: (id: string) => void
  createDemoKey: (scopeId: string) => DemoActionResult
  deleteKey: (id: string) => void
}
export type CredentialsStore = StoreApi<CredentialsState>
