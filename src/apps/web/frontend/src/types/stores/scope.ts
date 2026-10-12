/** A store holding one scope per widget instance; `Init` is any extra argument `initializeScope` takes. */
export interface ScopeState<T, Init extends unknown[] = []> {
  scopes: Partial<Record<string, T>>
  initializeScope: (id: string, ...init: Init) => void
  disposeScope: (id: string) => void
  patchScope: (id: string, patch: Partial<T>) => void
}
