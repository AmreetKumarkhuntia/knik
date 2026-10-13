import { createContext } from 'react'
import type { StoreBundle } from '$types/stores/session'

export const StoresContext = createContext<StoreBundle | null>(null)
