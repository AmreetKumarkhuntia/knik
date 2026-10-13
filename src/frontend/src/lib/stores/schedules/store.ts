import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { ScheduleStore } from '$types/stores/schedules'
import { scheduleActions } from './actions'
export function createScheduleStore(seed: DemoSnapshot) {
  return createStore<ScheduleStore>()((set, get) => ({
    schedules: structuredClone(seed.schedules),
    scopes: {},
    ...scheduleActions(set, get),
  }))
}
