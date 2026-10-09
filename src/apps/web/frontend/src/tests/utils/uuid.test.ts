import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateId } from '$utils/uuid'
import { createStoreBundle } from '$lib/stores/session/createStoreBundle'

afterEach(() => {
  vi.unstubAllGlobals()
})

// Over plain http on a LAN address or intranet hostname, crypto exists but randomUUID does not.
const stubInsecureContext = () => vi.stubGlobal('crypto', {})

describe('generateId', () => {
  it('uses crypto.randomUUID when the context provides it', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-1' })
    expect(generateId()).toBe('uuid-1')
    expect(generateId('node-')).toBe('node-uuid-1')
  })

  it('falls back to unique ids outside secure contexts', () => {
    stubInsecureContext()
    const ids = new Set(Array.from({ length: 50 }, () => generateId()))
    expect(ids.size).toBe(50)
  })
})

describe('store ids outside secure contexts', () => {
  it('starts and sends chats, and adds and saves builder nodes, without crypto.randomUUID', () => {
    stubInsecureContext()
    const bundle = createStoreBundle({})
    expect(() => bundle.chat.getState().startConversation()).not.toThrow()
    bundle.chat.getState().initializeScope('composer')
    bundle.chat.getState().patchScope('composer', { draft: 'hello' })
    expect(bundle.commands.sendMessage('composer')).toMatchObject({ ok: true })
    const [message] = bundle.chat.getState().conversations[0].messages
    expect(message.id).toEqual(expect.any(String))

    const workflows = bundle.workflows.getState()
    workflows.initBuilder('builder', undefined)
    workflows.addNode('builder', 'StartNode', { x: 0, y: 0 })
    workflows.addNode('builder', 'EndNode', { x: 200, y: 0 })
    const [start, end] = bundle.workflows.getState().builderScopes.builder?.nodes ?? []
    expect(start.id).not.toBe(end.id)
    workflows.connect('builder', {
      source: start.id,
      target: end.id,
      sourceHandle: null,
      targetHandle: null,
    })
    workflows.patchBuilder('builder', { name: 'Offline workflow' })
    expect(workflows.saveBuilder('builder')).toMatchObject({ ok: true, id: expect.any(String) })
  })
})
