import { describe, expect, it, vi } from 'vitest'
import { createShellStore } from '$stores/shell/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
describe('shell store', () => {
  it('disposes palette queries independently of the shared sidebar preference', () => {
    const store = createShellStore(normalizeDemoSource())
    store.getState().initializeScope('layout')
    store.getState().patchScope('layout', { paletteOpen: true, paletteQuery: 'settings' })
    store.getState().patchScope('layout', { mobileNavigationOpen: true })
    store.getState().togglePalette('layout')
    expect(store.getState().scopes.layout).toMatchObject({
      paletteOpen: false,
      mobileNavigationOpen: true,
    })
    store.getState().setCollapsed(true)
    store.getState().disposeScope('layout')
    store.getState().initializeScope('replacement')
    expect(store.getState().scopes.replacement).toEqual({
      mobileNavigationOpen: false,
      paletteOpen: false,
      paletteQuery: '',
    })
    expect(store.getState().collapsed).toBe(true)
  })

  it('skips the store update when a patch repeats the current values', () => {
    const store = createShellStore(normalizeDemoSource())
    store.getState().initializeScope('layout')
    const scope = store.getState().scopes.layout
    const updates = vi.fn()
    store.subscribe(updates)
    store.getState().patchScope('layout', { paletteQuery: '', mobileNavigationOpen: false })
    expect(store.getState().scopes.layout).toBe(scope)
    expect(updates).not.toHaveBeenCalled()
    store.getState().patchScope('layout', { mobileNavigationOpen: true })
    expect(store.getState().scopes.layout).toMatchObject({ mobileNavigationOpen: true })
    expect(updates).toHaveBeenCalledTimes(1)
  })
})
