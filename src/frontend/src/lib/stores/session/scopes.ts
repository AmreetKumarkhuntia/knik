import type { StoreApi } from 'zustand/vanilla'
import { omit } from '$utils/omit'

type Scopes<T> = Partial<Record<string, T>>

/**
 * init / dispose / patch for one `Record<scopeId, scope>` field of a store, plus `fail`, which
 * records an error on a scope and returns the failed action result. A patch for a missing scope, or
 * one that repeats the scope's current values, returns the same state so subscribers are not notified.
 */
export function scopeSlice<S, T extends object>(
  set: StoreApi<S>['setState'],
  key = 'scopes' as keyof S
) {
  const update = (change: (scopes: Scopes<T>) => Scopes<T>) =>
    set(state => {
      const scopes = state[key] as Scopes<T>
      const next = change(scopes)
      return next === scopes ? state : ({ [key]: next } as Partial<S>)
    })
  const patch = (id: string, change: Partial<T>) =>
    update(scopes => {
      const scope = scopes[id]
      return !scope ||
        Object.entries(change).every(([name, value]) => Object.is(scope[name as keyof T], value))
        ? scopes
        : { ...scopes, [id]: { ...scope, ...change } }
    })
  return {
    init: (id: string, scope: T) => update(scopes => ({ ...scopes, [id]: scope })),
    dispose: (id: string) => update(scopes => omit(scopes, id)),
    patch,
    fail: (id: string, error: string) => {
      patch(id, { error } as never) // only called on scopes that have an error field
      return { ok: false as const, error }
    },
  }
}
