import { createContext } from 'react'
import type { DemoSessionStore } from '$types/demo-session'
export const DemoSessionContext = createContext<DemoSessionStore | null>(null)
