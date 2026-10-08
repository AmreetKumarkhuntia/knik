import { useStore } from 'zustand'
import type { WorkflowStore } from '$types/stores/workflows'
import { useStoreBundle } from '../session/useStoreBundle'
export function useWorkflowStore<T>(selector: (state: WorkflowStore) => T): T {
  return useStore(useStoreBundle().workflows, selector)
}
