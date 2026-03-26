import type { StateCreator } from 'zustand'
import type { ToastType, ToastState } from '$types/components'

export interface ToastSlice {
  // State
  toasts: ToastState[]
  _nextToastId: number

  // Actions
  showToast: (message: string, type?: ToastType) => void
  hideToast: (id: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

export const createToastSlice: StateCreator<ToastSlice, [], [], ToastSlice> = (set, get) => ({
  // State
  toasts: [],
  _nextToastId: 0,

  // Actions
  showToast: (message: string, type: ToastType = 'info') => {
    const id = get()._nextToastId
    set(state => ({
      toasts: [...state.toasts, { id, message, type }],
      _nextToastId: state._nextToastId + 1,
    }))
  },

  hideToast: (id: number) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id),
    }))
  },

  success: (message: string) => {
    get().showToast(message, 'success')
  },

  error: (message: string) => {
    get().showToast(message, 'error')
  },

  info: (message: string) => {
    get().showToast(message, 'info')
  },
})
