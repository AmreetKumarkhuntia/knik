import { describe, expect, it } from 'vitest'
import { createCredentialsStore } from '$stores/credentials/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
describe('credential store', () => {
  it('retains invalid drafts and only reveals a supplied secret after a valid create', () => {
    const source = normalizeDemoSource({
        keyScenarios: [
          { id: 'key', label: 'Sample', key_prefix: 'demo_', scopes: ['read'], key: 'demo-secret' },
        ],
      }),
      store = createCredentialsStore(source)
    store.getState().initializeScope('editor')
    store.getState().patchScope('editor', { creating: true, label: 'Unknown' })
    expect(store.getState().createDemoKey('editor').ok).toBe(false)
    expect(store.getState().scopes.editor!.label).toBe('Unknown')
    expect(store.getState().apiKeys).toHaveLength(0)
    store.getState().closeEditor('editor')
    expect(store.getState().scopes.editor!.label).toBe('')
    store.getState().patchScope('editor', { label: 'Sample' })
    expect(store.getState().createDemoKey('editor').ok).toBe(true)
    expect(store.getState().apiKeys[0]).not.toHaveProperty('key')
    expect(store.getState().scopes.editor!.created?.key).toBe('demo-secret')
    store.getState().deleteKey('key')
    expect(store.getState().scopes.editor!.created).toBeNull()
    expect(source.apiKeys).toHaveLength(0)
  })
})
