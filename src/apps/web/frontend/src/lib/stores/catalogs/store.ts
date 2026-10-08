import { createStore } from 'zustand/vanilla'
import type { CatalogState } from '$types/stores/catalogs'
import type { DemoSnapshot } from '$types/stores/demo'

export function createCatalogStore(seed: DemoSnapshot) {
  return createStore<CatalogState>()(() =>
    structuredClone({
      models: seed.models,
      providers: seed.providers,
      voices: seed.voices,
      tools: seed.tools,
      toolDefinitions: seed.toolDefinitions,
      suggestions: seed.suggestions,
    })
  )
}
