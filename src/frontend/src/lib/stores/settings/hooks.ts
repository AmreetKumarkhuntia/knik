import { createStoreHook } from '../session/createStoreHook'
import { useScope } from '../session/useScope'
import { useStoreBundle } from '../session/useStoreBundle'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export const useSettingsStore = createStoreHook('settings')
export const useSettingsScope = () => useScope(useSettingsStore, EMPTY_SETTINGS_SCOPE)
export const useSettingsTransport = () => useStoreBundle().settingsTransport
