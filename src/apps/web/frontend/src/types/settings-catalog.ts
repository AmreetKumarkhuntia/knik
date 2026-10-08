import type { DemoSnapshot } from './demo-session'

export type SettingsCatalogKey = 'providers' | 'models' | 'voices' | 'tools' | 'apiKeys'
export type SettingsCatalogData = Pick<DemoSnapshot, SettingsCatalogKey>
