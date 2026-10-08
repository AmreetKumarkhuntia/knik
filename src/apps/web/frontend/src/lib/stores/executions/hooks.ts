import { useStore } from 'zustand'
import type { ExecutionStore } from '$types/stores/executions'
import { useStoreBundle } from '../session/useStoreBundle'
export function useExecutionStore<T>(selector: (state: ExecutionStore) => T): T {
  return useStore(useStoreBundle().executions, selector)
}
