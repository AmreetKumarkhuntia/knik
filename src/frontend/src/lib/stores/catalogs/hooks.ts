import type { CatalogKey, CatalogState } from '$types/stores/catalogs'
import { createStoreHook } from '../session/createStoreHook'
import { selectCatalog } from './selectors'

export const useCatalogStore = createStoreHook('catalogs')

export function useCatalog<K extends CatalogKey>(key: K): CatalogState[K] {
  return useCatalogStore(selectCatalog(key))
}
