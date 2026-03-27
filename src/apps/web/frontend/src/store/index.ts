import { create } from 'zustand'
import { createToastSlice, type ToastSlice } from './toastSlice'
import { createAudioSlice, type AudioSlice } from './audioSlice'
import { createChatSlice, type ChatSlice } from './chatSlice'

/**
 * Central application store combining all slices.
 *
 * Usage in components:
 *   import { useStore } from '$store/index'
 *   const messages = useStore(s => s.messages)
 *   const handleSend = useStore(s => s.handleSend)
 */
export type AppStore = ToastSlice & AudioSlice & ChatSlice

export const useStore = create<AppStore>()((...args) => ({
  ...createToastSlice(...args),
  ...createAudioSlice(...args),
  ...createChatSlice(...args),
}))

export type { ToastSlice } from './toastSlice'
export type { AudioSlice } from './audioSlice'
export type { ChatSlice } from './chatSlice'
