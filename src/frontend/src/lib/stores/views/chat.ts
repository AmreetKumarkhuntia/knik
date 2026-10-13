import { useMemo } from 'react'
import { formatTime } from '$utils/format'
import { useChatStore } from '../chat/hooks'
import { selectActiveConversation, selectRecentConversations } from '../chat/selectors'
import { toolCallsOf } from '../chat/stream'
import { useSettingsStore } from '../settings/hooks'
import { accountInitials, accountName } from '../settings/selectors'
import { useCatalog } from '../catalogs/hooks'
import { effectiveModelId } from '../catalogs/selectors'
export function useChatView() {
  const conversationId = useChatStore(s => s.activeConversationId)
  const conversation = useChatStore(selectActiveConversation)
  const isStreaming = useChatStore(s => !!conversationId && !!s.streaming[conversationId])
  const stopStreaming = useChatStore(s => s.stopStreaming)
  const settings = useSettingsStore(s => s.settings)
  const models = useCatalog('models'),
    suggestions = useCatalog('suggestions')
  const model = effectiveModelId(settings.model, models) ?? ''
  const messages = useMemo(
    () =>
      (conversation?.messages ?? [])
        .filter(message => message.role === 'user' || message.role === 'assistant')
        .map((message, index) => ({
          ...message,
          timestampLabel: formatTime(message.timestamp),
          isUser: message.role === 'user',
          toolCalls: toolCallsOf(message).map(call => ({
            ...call,
            status: call.status ?? ('success' as const),
          })),
          isStreaming: message.metadata.streaming === true,
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
    isStreaming,
    stop: () => conversationId && stopStreaming(conversationId),
    initials: accountInitials(accountName(settings)),
  }
}
export function useSidebarView() {
  const conversations = useChatStore(s => s.conversations)
  const settings = useSettingsStore(s => s.settings)
  const recentConversations = useMemo(
    () => selectRecentConversations({ conversations }),
    [conversations]
  )
  const name = accountName(settings)
  return { conversations: recentConversations, accountName: name, initials: accountInitials(name) }
}
