import { useId, useLayoutEffect, useRef } from 'react'

export function useWidgetScope(
  initialize: (scopeId: string) => void,
  dispose: (scopeId: string) => void,
  resourceKey = ''
) {
  const instanceId = useId()
  const scopeId = `${instanceId}:${resourceKey}`
  const callbacks = useRef({ initialize, dispose })
  useLayoutEffect(() => {
    callbacks.current = { initialize, dispose }
  })
  useLayoutEffect(() => {
    const owner = callbacks.current
    owner.initialize(scopeId)
    return () => owner.dispose(scopeId)
  }, [scopeId])
  return scopeId
}
