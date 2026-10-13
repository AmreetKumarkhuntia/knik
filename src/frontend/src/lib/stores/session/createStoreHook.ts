import { useStore, type ExtractState } from 'zustand'
import type { DomainStores } from '$types/stores/session'
import { useStoreBundle } from './useStoreBundle'

/** The selector hook for one domain store of the surrounding StoresProvider. */
export function createStoreHook<K extends keyof DomainStores>(key: K) {
  return function useDomainStore<T>(selector: (state: ExtractState<DomainStores[K]>) => T): T {
    return useStore(useStoreBundle()[key], selector)
  }
}
