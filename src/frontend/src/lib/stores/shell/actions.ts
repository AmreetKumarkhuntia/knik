import type { ShellStore, ShellScope, ShellState } from '$types/stores/shell'
import { scopeSlice } from '../session/scopes'
import { EMPTY_SHELL_SCOPE } from './selectors'
export function createShellActions(set: ShellStore['setState'], get: ShellStore['getState']) {
  const scopes = scopeSlice<ShellState, ShellScope>(set)
  return {
    setCollapsed: (collapsed: boolean) => set({ collapsed }),
    initializeScope: (id: string) => scopes.init(id, { ...EMPTY_SHELL_SCOPE }),
    disposeScope: scopes.dispose,
    patchScope: scopes.patch,
    togglePalette: (id: string) => {
      const scope = get().scopes[id]
      if (scope) scopes.patch(id, { paletteOpen: !scope.paletteOpen, paletteQuery: '' })
    },
  }
}
