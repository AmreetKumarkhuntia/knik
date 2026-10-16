import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { SettingsState } from '$types/stores/settings'
import { createSettingsActions } from './actions'
export function createSettingsStore(seed: DemoSnapshot) {
  return createStore<SettingsState>()(set => ({
    settings: structuredClone(seed.settings),
    appearance: structuredClone(seed.appearance),
    enabledTools: Object.fromEntries(seed.tools.map(tool => [tool.name, tool.enabled])),
    remote: { status: 'loading', error: null, definitions: [] },
    scopes: {},
    ...createSettingsActions(set),
  }))
}
