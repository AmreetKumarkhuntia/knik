import type { StoreApi } from 'zustand/vanilla'
import type { DemoSnapshot, DemoActionResult } from '$types/demo-session'
import type { ScopeState } from './scope'
export interface SettingsScope {
  displayName: string
  username: string
  confirmClear: boolean
  tab: string
}
export interface SettingsState
  extends Pick<DemoSnapshot, 'settings' | 'appearance'>, ScopeState<SettingsScope> {
  enabledTools: Record<string, boolean>
  updateSettings: (patch: Partial<DemoSnapshot['settings']>) => void
  updateAppearance: (patch: Partial<DemoSnapshot['appearance']>) => void
  toggleTool: (name: string, enabled: boolean) => void
  resetProfile: (scopeId: string) => void
  saveProfile: (scopeId: string) => DemoActionResult
}
export type SettingsStore = StoreApi<SettingsState>
