import type { SettingsCatalogData, SettingsCatalogKey } from '$types/settings-catalog'
import { useDemoSession } from './useDemoSession'

export function useSettingsCatalog<K extends SettingsCatalogKey>(key: K): SettingsCatalogData[K] {
  return useDemoSession(session => session[key])
}
