import { useStore } from 'zustand'
import type { ScheduleStore } from '$types/stores/schedules'
import { useStoreBundle } from '../session/useStoreBundle'
export function useScheduleStore<T>(selector: (state: ScheduleStore) => T): T {
  return useStore(useStoreBundle().schedules, selector)
}
