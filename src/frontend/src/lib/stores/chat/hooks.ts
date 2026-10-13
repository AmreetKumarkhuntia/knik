import { createStoreHook } from '../session/createStoreHook'
import { useScope } from '../session/useScope'
import { useStoreBundle } from '../session/useStoreBundle'
import { EMPTY_CHAT_SCOPE } from './selectors'
export const useChatStore = createStoreHook('chat')
export const useChatScope = (resourceId: string | null = null) =>
  useScope(useChatStore, EMPTY_CHAT_SCOPE, resourceId)
export function useSendMessage() {
  return useStoreBundle().commands.sendMessage
}
