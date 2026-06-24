/** Request payload for sending a chat message. */
export interface ChatRequest {
  message: string
  conversation_id?: string
}

/** API response for a chat message. */
export interface ChatResponse {
  text: string
  audio: string
  audioChunks: string[]
  sample_rate: number
  conversation_id?: string
}

/** A single message within a conversation. */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  timestamp: string
  metadata: Record<string, unknown>
}

/** A conversation with its messages. */
export interface Conversation {
  id: string
  title: string | null
  messages: ConversationMessage[]
  created_at: string | null
  updated_at: string | null
  summary_message_id: string | null
  compacted_count: number
  total_tokens: number
  /** Short snippet of the last message — populated by the list endpoint (messages omitted there). */
  preview?: string | null
  /** Number of messages in the conversation — populated by the list endpoint. */
  message_count?: number
}

/** Paginated API response listing conversations. */
export interface ConversationListResponse {
  conversations: Conversation[]
  count: number
  limit: number
  offset: number
}
