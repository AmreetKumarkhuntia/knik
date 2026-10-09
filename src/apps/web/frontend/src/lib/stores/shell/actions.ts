import type { ShellStore, ShellScope } from '$types/stores/shell'
import { EMPTY_SHELL_SCOPE } from './selectors'
export function createShellActions(set: ShellStore['setState']) {
  return {
    setCollapsed: (collapsed: boolean) => set({ collapsed }),
    initializeScope: (id: string) =>
      set(state => ({ scopes: { ...state.scopes, [id]: { ...EMPTY_SHELL_SCOPE } } })),
    disposeScope: (id: string) =>
      set(state => {
        const scopes = { ...state.scopes }
        delete scopes[id]
        return { scopes }
      }),
    patchScope: (id: string, patch: Partial<ShellScope>) =>
      set(state => {
        const scope = state.scopes[id]
        // Returning the same state skips notifying subscribers when nothing would change.
        if (
          !scope ||
          Object.entries(patch).every(([key, value]) =>
            Object.is(scope[key as keyof ShellScope], value)
          )
        )
          return state
        return { scopes: { ...state.scopes, [id]: { ...scope, ...patch } } }
      }),
    togglePalette: (id: string) =>
      set(state =>
        state.scopes[id]
          ? {
              scopes: {
                ...state.scopes,
                [id]: {
                  ...state.scopes[id],
                  paletteOpen: !state.scopes[id].paletteOpen,
                  paletteQuery: '',
                },
              },
            }
          : {}
      ),
  }
}
