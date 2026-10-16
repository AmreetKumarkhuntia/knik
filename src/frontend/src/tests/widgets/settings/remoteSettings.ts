import { vi } from 'vitest'
import type { SettingDefinition, SettingsTransport } from '$types/sections/settings'

type Required = Pick<SettingDefinition, 'key' | 'type' | 'label' | 'group'>
const definition = (fields: Required & Partial<SettingDefinition>): SettingDefinition => ({
  env: `KNIK_${fields.key.toUpperCase()}`,
  default: null,
  description: '',
  options: null,
  secret: false,
  value: null,
  source: 'default',
  ...fields,
})

/** A backend schema the way GET /api/admin/settings lists it: three groups, every control type, one stored key. */
export const remoteSettings: SettingDefinition[] = [
  definition({
    key: 'display_name',
    type: 'str',
    label: 'Display name',
    group: 'Profile',
    value: 'Alex',
  }),
  definition({
    key: 'ai_provider',
    type: 'str',
    label: 'Provider',
    group: 'AI',
    options: ['vertex', 'mock'],
    value: 'vertex',
    default: 'vertex',
    source: 'env',
  }),
  definition({
    key: 'ai_model',
    type: 'str',
    label: 'Model',
    group: 'AI',
    value: 'gemini-1.5-flash',
    default: 'gemini-1.5-flash',
    source: 'db',
  }),
  definition({
    key: 'temperature',
    type: 'float',
    label: 'Temperature',
    group: 'AI',
    value: 0.7,
    default: 0.7,
  }),
  definition({
    key: 'max_tokens',
    type: 'int',
    label: 'Max output tokens',
    group: 'AI',
    description: "Empty leaves the provider's own limit.",
    value: 1024,
  }),
  definition({
    key: 'custom_api_key',
    type: 'str',
    label: 'Custom API key',
    group: 'AI',
    secret: true,
    value: '••••••',
    source: 'db',
  }),
  definition({
    key: 'voice_name',
    type: 'str',
    label: 'Voice',
    group: 'Voice',
    options: ['af_heart', 'am_adam'],
    value: 'af_heart',
    default: 'af_heart',
  }),
  definition({
    key: 'enable_voice_output',
    type: 'bool',
    label: 'Speak replies',
    group: 'Voice',
    value: true,
    default: true,
  }),
]

/** A transport that answers from memory and records every call; nothing reaches the network. */
export function fakeTransport(definitions: SettingDefinition[] = remoteSettings) {
  return {
    load: vi.fn<SettingsTransport['load']>(async () => structuredClone(definitions)),
    save: vi.fn<SettingsTransport['save']>(async () => undefined),
    reset: vi.fn<SettingsTransport['reset']>(async () => undefined),
  }
}
