import { describe, expect, it } from 'vitest'
import { createSettingsStore } from '$stores/settings/store'
import { fieldValue, groupDefinitions, parseField, remoteChanges } from '$stores/settings/selectors'
import { normalizeDemoSource } from '$stores/demo/normalize'
import { remoteSettings } from '../../widgets/settings/remoteSettings'
const field = (key: string) => remoteSettings.find(item => item.key === key)!
describe('settings store', () => {
  it('turns a draft into typed changes for the keys that differ, and errors for text that is not a number', () => {
    const { changes, errors } = remoteChanges(remoteSettings, {
      display_name: 'Alex',
      ai_model: 'gpt-4o',
      temperature: '0.3',
      max_tokens: '1.5',
      custom_api_key: 'new',
      enable_voice_output: false,
    })
    expect(changes).toEqual({
      ai_model: 'gpt-4o',
      temperature: 0.3,
      custom_api_key: 'new',
      enable_voice_output: false,
    })
    expect(errors).toEqual({ max_tokens: 'Enter a whole number.' })
    expect(parseField(field('temperature'), ' ')).toEqual({ error: 'Enter a number.' })
    expect(remoteChanges(remoteSettings, { custom_api_key: '' }).changes).toEqual({})
  })
  it('shows loaded values as control values, never a secret, and keeps the backend group order', () => {
    expect(fieldValue(field('temperature'), {})).toBe('0.7')
    expect(fieldValue(field('enable_voice_output'), {})).toBe(true)
    expect(fieldValue(field('custom_api_key'), {})).toBe('')
    expect(fieldValue(field('display_name'), { display_name: 'Draft' })).toBe('Draft')
    expect(
      groupDefinitions(remoteSettings).map(([group, fields]) => [group, fields.length])
    ).toEqual([
      ['Profile', 1],
      ['AI', 5],
      ['Voice', 2],
    ])
  })
  it('merges remote patches and keeps each scope its own draft', () => {
    const store = createSettingsStore(normalizeDemoSource())
    store.getState().setRemote({ status: 'ready', definitions: remoteSettings })
    expect(store.getState().remote).toEqual({
      status: 'ready',
      error: null,
      definitions: remoteSettings,
    })
    store.getState().initializeScope('left')
    store.getState().initializeScope('right')
    store.getState().patchScope('left', { draft: { ai_model: 'm2' } })
    expect(store.getState().scopes.right!.draft).toEqual({})
    store.getState().disposeScope('left')
    expect(store.getState().scopes.left).toBeUndefined()
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
