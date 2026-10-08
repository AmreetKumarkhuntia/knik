import { useState } from 'react'
import type { DemoSessionProviderProps } from '$types/demo-session'
import { createDemoSessionStore } from './store'
import { DemoSessionContext } from './context'

export function DemoSessionProvider({ children, source }: DemoSessionProviderProps) {
  // A route change or parent rerender must never replace the current session.
  const [store] = useState(() => createDemoSessionStore(source))
  return <DemoSessionContext.Provider value={store}>{children}</DemoSessionContext.Provider>
}
