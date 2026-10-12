import { createStoreHook } from '../session/createStoreHook'
import { useScope } from '../session/useScope'
import { EMPTY_SETTINGS_SCOPE } from './selectors'
export const useSettingsStore = createStoreHook('settings')
export const useSettingsScope = () => useScope(useSettingsStore, EMPTY_SETTINGS_SCOPE)
