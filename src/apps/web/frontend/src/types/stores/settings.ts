import type { StoreApi } from 'zustand/vanilla'
import type { DemoSnapshot, DemoActionResult } from '$types/demo-session'
export interface SettingsScope {
  displayName: string
  username: string
  confirmClear: boolean
  tab: string
  playing: boolean
}
export interface SettingsState extends Pick<DemoSnapshot, 'settings' | 'appearance'> {
  enabledTools: Record<string, boolean>
  scopes: Partial<Record<string, SettingsScope>>
  initializeScope: (id: string) => void
  disposeScope: (id: string) => void
  patchScope: (id: string, patch: Partial<SettingsScope>) => void
  updateSettings: (patch: Partial<DemoSnapshot['settings']>) => void
  updateAppearance: (patch: Partial<DemoSnapshot['appearance']>) => void
  toggleTool: (name: string, enabled: boolean) => void
  resetProfile: (scopeId: string) => void
  saveProfile: (scopeId: string) => DemoActionResult
}
export type SettingsStore = StoreApi<SettingsState>
