import type { StoreApi } from 'zustand/vanilla'
export type Viewport = 'mobile' | 'tablet' | 'desktop'
export interface ShellScope {
  mobileNavigationOpen: boolean
  paletteOpen: boolean
  paletteQuery: string
}
export interface ShellState {
  collapsed: boolean
  scopes: Partial<Record<string, ShellScope>>
  setCollapsed: (value: boolean) => void
  initializeScope: (id: string) => void
  disposeScope: (id: string) => void
  patchScope: (id: string, patch: Partial<ShellScope>) => void
  togglePalette: (id: string) => void
}
export type ShellStore = StoreApi<ShellState>
