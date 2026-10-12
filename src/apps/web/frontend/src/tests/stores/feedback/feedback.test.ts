import { describe, expect, it } from 'vitest'
import { createFeedbackStore } from '$stores/feedback/store'
describe('feedback store', () => {
  it('isolates toast queues between providers and removes one toast at a time', () => {
    const first = createFeedbackStore(),
      second = createFeedbackStore()
    first.getState().addToast('Saved', 'success')
    first.getState().addToast('Copied')
    const id = first.getState().toasts[0].id
    first.getState().hideToast(id)
    expect(first.getState().toasts.map(toast => toast.message)).toEqual(['Copied'])
    expect(second.getState().toasts).toEqual([])
  })
})
