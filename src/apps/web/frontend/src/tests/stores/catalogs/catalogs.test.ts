import { createElement } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StoresProvider } from '$stores'
import { useSettingsStore } from '$stores/settings'
import { useCredentialsStore, useCredentialsScope } from '$stores/credentials'
import { useCatalog } from '$stores/catalogs'
import { useProvidersView } from '$stores/views'
import type { DemoSource } from '$types/demo-session'

const source: DemoSource = {
  providers: [{ id: 'custom-provider', name: 'Custom Provider' }],
  models: [{ id: 'custom-model', label: 'Custom Model', vendor: 'Custom Provider' }],
  voices: [{ id: 'custom-voice', name: 'Custom Voice', audioSrc: '/assets/voice.wav' }],
  tools: [{ name: 'Custom Tools', category: 'Custom', count: 3, enabled: true }],
  apiKeys: [
    {
      id: 'sample-key',
      label: 'Sample Key',
      key_prefix: 'sample',
      scopes: ['read'],
      created_at: null,
      last_used_at: null,
    },
  ],
  keyScenarios: [
    {
      id: 'new-key',
      label: 'New Key',
      key_prefix: 'demo',
      scopes: ['read'],
      key: 'supplied-demo-value',
    },
  ],
}

function useCatalogs() {
  const providers = useCatalog('providers')
  const models = useCatalog('models')
  const voices = useCatalog('voices')
  const { tools } = useProvidersView()
  const apiKeys = useCredentialsStore(state => state.apiKeys)
  const toggleTool = useSettingsStore(session => session.toggleTool)
  const create = useCredentialsStore(session => session.createDemoKey)
  const scope = useCredentialsScope()
  const createKey = (label: string) => {
    scope.patch({ label })
    return create(scope.scopeId)
  }
  const deleteKey = useCredentialsStore(session => session.deleteKey)
  return { providers, models, voices, tools, apiKeys, toggleTool, createKey, deleteKey }
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(StoresProvider, { source, children })

describe('store-owned settings catalogs', () => {
  it('reads arbitrary supplied catalogs without built-in provider, voice or tool options', () => {
    const { result } = renderHook(useCatalogs, { wrapper })
    expect(result.current.providers).toEqual(source.providers)
    expect(result.current.models).toEqual(source.models)
    expect(result.current.voices).toEqual(source.voices)
    expect(result.current.tools).toEqual(source.tools)
    expect(result.current.apiKeys).toEqual(source.apiKeys)
    expect(result.current.models[0].label).toBe('Custom Model')
    expect(result.current.voices[0].audioSrc).toBe('/assets/voice.wav')
  })

  it('subscribes to local tool and key updates without mutating supplied fixtures', () => {
    const original = structuredClone(source)
    const { result } = renderHook(useCatalogs, { wrapper })
    act(() => result.current.toggleTool('Custom Tools', false))
    expect(result.current.tools[0].enabled).toBe(false)
    act(() => {
      expect(result.current.createKey('New Key')).toMatchObject({ ok: true })
    })
    expect(result.current.apiKeys.map(key => key.id)).toEqual(['sample-key', 'new-key'])
    act(() => result.current.deleteKey('sample-key'))
    expect(result.current.apiKeys.map(key => key.id)).toEqual(['new-key'])
    expect(source).toEqual(original)
  })

  it('isolates catalogs and committed selections between providers', () => {
    const first = renderHook(useCatalogs, { wrapper })
    const second = renderHook(useCatalogs, { wrapper })
    act(() => {
      first.result.current.toggleTool('Custom Tools', false)
      first.result.current.deleteKey('sample-key')
    })
    expect(first.result.current.tools[0].enabled).toBe(false)
    expect(first.result.current.apiKeys).toEqual([])
    expect(second.result.current.tools[0].enabled).toBe(true)
    expect(second.result.current.apiKeys).toEqual(source.apiKeys)
  })

  it('keeps omitted collections in an explicitly supplied source empty', () => {
    const unspecified = renderHook(useCatalogs, {
      wrapper: ({ children }) => createElement(StoresProvider, { children, source: {} }),
    })
    const empty = renderHook(useCatalogs, {
      wrapper: ({ children }) =>
        createElement(StoresProvider, {
          children,
          source: { providers: [], models: [], voices: [], tools: [], apiKeys: [] },
        }),
    })
    for (const result of [unspecified.result, empty.result]) {
      expect(result.current.providers).toEqual([])
      expect(result.current.models).toEqual([])
      expect(result.current.voices).toEqual([])
      expect(result.current.tools).toEqual([])
      expect(result.current.apiKeys).toEqual([])
    }
  })

  it('does not call any transport while reading catalogs or applying local actions', () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected fetch'))
    const xhr = vi.spyOn(XMLHttpRequest.prototype, 'send')
    const websocket = vi.spyOn(globalThis, 'WebSocket')
    const populated = renderHook(useCatalogs, { wrapper })
    renderHook(useCatalogs, {
      wrapper: ({ children }) => createElement(StoresProvider, { children, source: {} }),
    })
    act(() => {
      populated.result.current.toggleTool('Custom Tools', false)
      populated.result.current.createKey('New Key')
      populated.result.current.deleteKey('sample-key')
    })
    expect(fetcher).not.toHaveBeenCalled()
    expect(xhr).not.toHaveBeenCalled()
    expect(websocket).not.toHaveBeenCalled()
  })
})
