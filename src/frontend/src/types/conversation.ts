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

export type ToolCallKind = 'tool' | 'skill' | 'mcp'
export type ToolCallStatus = 'running' | 'success' | 'error'

/** One entry of an assistant message's `metadata.tool_calls`; mirrors the backend's shape. */
export interface ToolCall {
  id: string
  tool_name: string
  tool_args: Record<string, unknown>
  tool_result?: unknown
  /** Defaults to 'tool'. */
  kind?: ToolCallKind
  /** Absent on persisted history, which only stores finished calls. */
  status?: ToolCallStatus
  error?: string
  duration_ms?: number
}

/** Incremental updates for one assistant reply; the demo replays them and a backend stream can emit them. */
export type ChatStreamEvent =
  | { type: 'message_start'; messageId: string; metadata?: Record<string, unknown> }
  | { type: 'tool_start'; call: Omit<ToolCall, 'status' | 'tool_result' | 'error'> }
  | { type: 'tool_end'; id: string; result?: unknown; error?: string; duration_ms: number }
  | { type: 'text_delta'; text: string }
  | { type: 'message_end' }
