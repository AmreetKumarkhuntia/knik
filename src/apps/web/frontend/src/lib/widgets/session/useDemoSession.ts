import { useContext } from 'react'
import { useStore } from 'zustand'
import type { DemoSession } from '$types/demo-session'
import { DemoSessionContext } from './context'
export function useDemoSession<T>(selector: (state: DemoSession) => T): T {
  const store = useContext(DemoSessionContext)
  if (!store) throw new Error('Widgets must be mounted inside DemoSessionProvider.')
  return useStore(store, selector)
}
