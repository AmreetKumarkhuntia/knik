import { useContext } from 'react'
import { StoresContext } from './context'

export function useStoreBundle() {
  const bundle = useContext(StoresContext)
  if (!bundle) throw new Error('Store consumers must be mounted inside StoresProvider.')
  return bundle
}
