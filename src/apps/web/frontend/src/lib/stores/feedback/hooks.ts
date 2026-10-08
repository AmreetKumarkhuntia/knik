import { useStore } from 'zustand'
import type { FeedbackState } from '$types/stores/feedback'
import { useStoreBundle } from '../session/useStoreBundle'
export function useFeedbackStore<T>(selector: (state: FeedbackState) => T): T {
  return useStore(useStoreBundle().feedback, selector)
}
