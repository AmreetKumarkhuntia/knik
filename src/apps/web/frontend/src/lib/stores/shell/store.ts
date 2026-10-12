import { createStore } from 'zustand/vanilla'
import type { ShellState } from '$types/stores/shell'
import { createShellActions } from './actions'
export function createShellStore() {
  return createStore<ShellState>()((set, get) => ({
    collapsed: false,
    scopes: {},
    ...createShellActions(set, get),
  }))
}
