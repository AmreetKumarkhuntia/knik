import { vi } from 'vitest'
import type { SettingDefinition, SettingsTransport } from '$types/sections/settings'
import { remoteSettings } from '../../fixtures/remoteSettings'

export { remoteSettings }

/** A transport that answers from memory and records every call; nothing reaches the network. */
export function fakeTransport(definitions: SettingDefinition[] = remoteSettings) {
  return {
    load: vi.fn<SettingsTransport['load']>(async () => structuredClone(definitions)),
    save: vi.fn<SettingsTransport['save']>(async () => undefined),
    reset: vi.fn<SettingsTransport['reset']>(async () => undefined),
  }
}
