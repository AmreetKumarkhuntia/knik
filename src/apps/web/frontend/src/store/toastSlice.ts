import type { StateCreator } from 'zustand'
import type { ToastType, ToastState } from '$types/components'

/** Zustand slice for toast notification state and actions. */
export interface ToastSlice {
  toasts: ToastState[]
  _nextToastId: number

  showToast: (message: string, type?: ToastType) => void
  hideToast: (id: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

/** Creates the toast slice with show, hide, success, error, and info helpers. */
export const createToastSlice: StateCreator<ToastSlice, [], [], ToastSlice> = (set, get) => ({
  toasts: [],
  _nextToastId: 0,

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
