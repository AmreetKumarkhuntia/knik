import { describe, expect, it } from 'vitest'
import { createShellStore } from '$stores/shell/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
describe('shell store', () => {
  it('disposes palette queries independently of the shared sidebar preference', () => {
    const store = createShellStore(normalizeDemoSource())
    store.getState().initializeScope('layout')
    store.getState().patchScope('layout', { paletteOpen: true, paletteQuery: 'settings' })
    store.getState().patchScope('layout', { viewport: 'mobile', mobileNavigationOpen: true })
    store.getState().togglePalette('layout')
    expect(store.getState().scopes.layout).toMatchObject({
      viewport: 'mobile',
      mobileNavigationOpen: true,
    })
    store.getState().setCollapsed(true)
    store.getState().disposeScope('layout')
    store.getState().initializeScope('replacement')
    expect(store.getState().scopes.replacement).toEqual({
      viewport: 'desktop',
      mobileNavigationOpen: false,
      paletteOpen: false,
      paletteQuery: '',
    })
    expect(store.getState().collapsed).toBe(true)
  })
})
