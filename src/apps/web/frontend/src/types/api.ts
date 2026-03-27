export interface ChatRequest {
  message: string
  conversation_id?: string
}

export interface ChatResponse {
  text: string
  audio: string
  audioChunks: string[]
  sample_rate: number
  conversation_id?: string
}

export interface ConversationMessage {
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
}

export interface ConversationListResponse {
  conversations: Conversation[]
  count: number
  limit: number
  offset: number
}
