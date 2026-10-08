import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { ShellState } from '$types/stores/shell'
import { createShellActions } from './actions'
export function createShellStore(_seed: DemoSnapshot) {
  return createStore<ShellState>()(set => ({
    collapsed: false,
    scopes: {},
    ...createShellActions(set),
  }))
}
