import { createStore } from 'zustand/vanilla'
import type { DemoSnapshot } from '$types/demo-session'
import type { FeedbackState } from '$types/stores/feedback'
import { createFeedbackActions } from './actions'
export function createFeedbackStore(_seed: DemoSnapshot) {
  return createStore<FeedbackState>()(set => ({ toasts: [], ...createFeedbackActions(set) }))
}
