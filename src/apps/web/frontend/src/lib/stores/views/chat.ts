import type { AgentThinkingStep } from '$types/components/chat'
import { useMemo } from 'react'
import { useChatStore } from '../chat/hooks'
import { selectActiveConversation, selectRecentConversations } from '../chat/selectors'
import { useSettingsStore } from '../settings/hooks'
import { accountInitials } from '../settings/selectors'
import { useCatalog } from '../catalogs/hooks'
export function useChatView() {
  const conversationId = useChatStore(s => s.activeConversationId)
  const conversation = useChatStore(selectActiveConversation)
  const settings = useSettingsStore(s => s.settings)
  const models = useCatalog('models'),
    suggestions = useCatalog('suggestions')
  const model = settings.model || models[0]?.id || ''
  const messages = useMemo(
    () =>
      (conversation?.messages ?? [])
        .filter(message => message.role === 'user' || message.role === 'assistant')
        .map((message, index) => ({
          ...message,
          isUser: message.role === 'user',
          steps: Array.isArray(message.metadata.reasoning)
            ? (message.metadata.reasoning as AgentThinkingStep[])
            : [],
          modelTag: typeof message.metadata.model === 'string' ? message.metadata.model : undefined,
          messageId:
            typeof message.metadata.message_id === 'string'
              ? message.metadata.message_id
              : `${conversationId}:${index}`,
        })),
    [conversation, conversationId]
  )
  return {
    conversationId,
    conversation,
    models,
    suggestions,
    model,
    messages,
    initials: accountInitials(settings.display_name || settings.username || ''),
  }
}
export function useSidebarView() {
  const conversations = useChatStore(s => s.conversations)
  const settings = useSettingsStore(s => s.settings)
  const recentConversations = useMemo(
    () => selectRecentConversations({ conversations }),
    [conversations]
  )
  const accountName = settings.display_name || settings.username || ''
  return { conversations: recentConversations, accountName, initials: accountInitials(accountName) }
}
