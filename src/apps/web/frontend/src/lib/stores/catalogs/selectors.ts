import type { CatalogKey, CatalogState } from '$types/stores/catalogs'

export const selectCatalog =
  <K extends CatalogKey>(key: K) =>
  (state: CatalogState) =>
    state[key]
