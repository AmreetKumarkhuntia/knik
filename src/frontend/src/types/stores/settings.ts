import type { StoreApi } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { SettingDefinition } from '../sections/settings'
import type { ScopeState } from './scope'
export interface SettingsScope {
  confirmClear: boolean
  tab: string
  /** Edited backend settings by key, as their controls hold them: a boolean for a switch, text for the rest. */
  draft: Partial<Record<string, string | boolean>>
  saving: boolean
}
/** The backend settings as last loaded; `error` holds the failure the Retry state shows. */
export interface RemoteSettings {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  definitions: SettingDefinition[]
  /** Counts loads, so a result that an earlier load delivers late is ignored. */
  loadId: number
}
export interface SettingsState
  extends Pick<DemoSnapshot, 'settings' | 'appearance'>, ScopeState<SettingsScope> {
  enabledTools: Record<string, boolean>
  remote: RemoteSettings
  startLoad: () => number
  finishLoad: (loadId: number, patch: Partial<RemoteSettings>) => void
  setRemote: (patch: Partial<RemoteSettings>) => void
  dropDraftKeys: (scopeId: string, keys: string[]) => void
  updateSettings: (patch: Partial<DemoSnapshot['settings']>) => void
  updateAppearance: (patch: Partial<DemoSnapshot['appearance']>) => void
  toggleTool: (name: string, enabled: boolean) => void
}
export type SettingsStore = StoreApi<SettingsState>
