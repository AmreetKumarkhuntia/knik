import { useStore } from 'zustand'
import type { CatalogKey, CatalogState } from '$types/stores/catalogs'
import { useStoreBundle } from '../session/useStoreBundle'
import { selectCatalog } from './selectors'

export function useCatalogStore<T>(selector: (state: CatalogState) => T): T {
  return useStore(useStoreBundle().catalogs, selector)
}

export function useCatalog<K extends CatalogKey>(key: K): CatalogState[K] {
  return useCatalogStore(selectCatalog(key))
}
