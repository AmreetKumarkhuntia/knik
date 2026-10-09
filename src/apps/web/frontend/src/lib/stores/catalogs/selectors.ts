import type { CatalogKey, CatalogState } from '$types/stores/catalogs'

export const selectCatalog =
  <K extends CatalogKey>(key: K) =>
  (state: CatalogState) =>
    state[key]

/**
 * The model chat and the builder use: the selected model when the catalog has it, the first catalog
 * model when nothing is selected, and none when the selection is not in the catalog, so an
 * unavailable selection never silently becomes a different model.
 */
export function effectiveModelId(selectedId: string, models: readonly { id: string }[]) {
  if (!selectedId) return models.at(0)?.id
  return models.some(model => model.id === selectedId) ? selectedId : undefined
}
