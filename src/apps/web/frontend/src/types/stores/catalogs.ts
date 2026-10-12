import type { DemoSnapshot } from './demo'

export type CatalogState = Pick<
  DemoSnapshot,
  'models' | 'providers' | 'voices' | 'tools' | 'suggestions'
>
export type CatalogKey = keyof CatalogState
