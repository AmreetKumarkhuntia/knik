import { createStore } from 'zustand/vanilla'
import type { FeedbackState } from '$types/stores/feedback'
import { createFeedbackActions } from './actions'
export function createFeedbackStore() {
  return createStore<FeedbackState>()(set => ({ toasts: [], ...createFeedbackActions(set) }))
}
