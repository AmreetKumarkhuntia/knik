import { describe, expect, it } from 'vitest'
import { createCredentialsStore } from '$stores/credentials/store'
import { normalizeDemoSource } from '$stores/demo/normalize'
describe('credential store', () => {
  it('removes a listed key from the session without touching the source', () => {
    const source = normalizeDemoSource({
        apiKeys: [
          {
            id: 'key',
            label: 'Sample',
            key_prefix: 'demo_',
            scopes: ['read'],
            created_at: null,
            last_used_at: null,
          },
        ],
      }),
      store = createCredentialsStore(source)
    store.getState().initializeScope('editor')
    store.getState().patchScope('editor', { deletingId: 'key' })
    expect(store.getState().scopes.editor!.deletingId).toBe('key')
    store.getState().deleteKey('key')
    expect(store.getState().apiKeys).toHaveLength(0)
    expect(source.apiKeys).toHaveLength(1)
  })
})
