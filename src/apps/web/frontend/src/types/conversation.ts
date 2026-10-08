export interface ConversationMessage {
  id?: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
  timestamp: string
  metadata: Record<string, unknown>
}

export interface Conversation {
  id: string
  title: string | null
  messages: ConversationMessage[]
  created_at: string | null
  updated_at: string | null
  summary_message_id: string | null
  compacted_count: number
  total_tokens: number
  preview?: string | null
  message_count?: number
}
