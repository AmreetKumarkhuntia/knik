import { useState } from 'react'
import type { StoresProviderProps } from '$types/stores/demo'
import { createStoreBundle } from './createStoreBundle'
import { StoresContext } from './context'

export function StoresProvider({ children, source }: StoresProviderProps) {
  const [bundle] = useState(() => createStoreBundle(source))
  return <StoresContext.Provider value={bundle}>{children}</StoresContext.Provider>
}
