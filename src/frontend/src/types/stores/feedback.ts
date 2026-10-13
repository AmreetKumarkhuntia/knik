import type { StoreApi } from 'zustand/vanilla'
import type { DemoToast } from '$types/demo-session'
export interface FeedbackState {
  toasts: DemoToast[]
  addToast: (message: string, type?: DemoToast['type']) => void
  hideToast: (id: number) => void
}
export type FeedbackStore = StoreApi<FeedbackState>
