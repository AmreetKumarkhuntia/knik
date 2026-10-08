import { describe, expect, it } from 'vitest'
import { createSettingsStore } from '$stores/settings/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
describe('settings store', () => {
  it('isolates profile drafts, commits trimmed values and cancels against current records', () => {
    const source = normalizeDemoSource({ settings: { display_name: 'Alex', username: 'alex' } }),
      store = createSettingsStore(source)
    store.getState().initializeScope('left')
    store.getState().initializeScope('right')
    store.getState().patchScope('left', { displayName: ' Alex Lee ' })
    store.getState().saveProfile('left')
    expect(store.getState().settings.display_name).toBe('Alex Lee')
    expect(store.getState().scopes.right!.displayName).toBe('Alex')
    store.getState().resetProfile('right')
    expect(store.getState().scopes.right!.displayName).toBe('Alex Lee')
    store.getState().disposeScope('left')
    expect(store.getState().scopes.left).toBeUndefined()
    expect(store.getState().settings.display_name).toBe('Alex Lee')
    expect(source.settings.display_name).toBe('Alex')
  })
  it('owns tool selections without mutating catalog source and resets appearance with the seed', () => {
    const source = normalizeDemoSource({
        tools: [{ name: 'Example', category: 'demo', count: 1, enabled: false }],
      }),
      store = createSettingsStore(source)
    store.getState().toggleTool('Example', true)
    store.getState().updateAppearance({ mode: 'light' })
    expect(store.getState().appearance).toEqual({ mode: 'light' })
    expect(store.getState().enabledTools.Example).toBe(true)
    expect(source.tools[0].enabled).toBe(false)
    expect(createSettingsStore(source).getState().appearance).toEqual(source.appearance)
  })
})
