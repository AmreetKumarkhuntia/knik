import type { FeedbackState } from '$types/stores/feedback'
export const selectToasts = (state: FeedbackState) => state.toasts
