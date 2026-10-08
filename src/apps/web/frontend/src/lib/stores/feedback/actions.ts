import type { FeedbackStore } from '$types/stores/feedback'
import type { DemoToast } from '$types/demo-session'
export function createFeedbackActions(set: FeedbackStore['setState']) {
  let nextId = 0
  return {
    addToast: (message: string, type: DemoToast['type'] = 'info') =>
      set(state => ({ toasts: [...state.toasts, { id: ++nextId, message, type }] })),
    hideToast: (id: number) =>
      set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
  }
}
