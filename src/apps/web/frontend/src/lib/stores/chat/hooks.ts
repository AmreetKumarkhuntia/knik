import { useCallback } from 'react'
import { useStore } from 'zustand'
import type { ChatState } from '$types/stores/chat'
import { useStoreBundle } from '../session/useStoreBundle'
import { useWidgetScope } from '../session/useWidgetScope'
import { EMPTY_CHAT_SCOPE } from './selectors'
export function useChatStore<T>(selector: (state: ChatState) => T): T {
  return useStore(useStoreBundle().chat, selector)
}
export function useChatScope(resourceId: string | null = null) {
  const initialize = useChatStore(s => s.initializeScope),
    dispose = useChatStore(s => s.disposeScope)
  const scopeId = useWidgetScope(id => initialize(id, resourceId), dispose, resourceId ?? undefined)
  const scope = useChatStore(s => s.scopes[scopeId] ?? EMPTY_CHAT_SCOPE)
  const patch = useChatStore(s => s.patchScope)
  const patchScoped = useCallback(
    (change: Partial<typeof scope>) => patch(scopeId, change),
    [patch, scopeId]
  )
  return { scopeId, scope, patch: patchScoped }
}
export function useSendMessage() {
  return useStoreBundle().commands.sendMessage
}
