import type { StoreApi } from 'zustand/vanilla'
import type { ScopeState } from './scope'
export type Viewport = 'mobile' | 'tablet' | 'desktop'
export interface ShellScope {
  mobileNavigationOpen: boolean
  paletteOpen: boolean
  paletteQuery: string
}
export interface ShellState extends ScopeState<ShellScope> {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  togglePalette: (id: string) => void
}
export type ShellStore = StoreApi<ShellState>
