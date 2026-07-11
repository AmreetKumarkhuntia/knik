import type { ChatModelOption } from '$types/components/chat'

/** A chat message with role and content. */
export interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

/** Props for the chat message panel. */
export interface ChatPanelProps {
  messages: Message[]
  isLoading?: boolean
  summaryMessageId?: string | null
}

/** Props for the chat input panel. */
export interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  model?: string
  onModel?: (id: string) => void
  models?: ChatModelOption[]
}

/** Imperative handle exposed by the input panel via ref. */
export interface InputPanelRef {
  focus: () => void
  clear: () => void
}

/** Props for the compaction divider shown when a conversation is summarized. */
export interface CompactionDividerProps {
  summaryContent?: string
}

/** A single item in the demo conversation history list. */
export interface ConversationHistoryItem {
  id: string
  name: string
  time: string
  group: string
  tag: string
  preview: string
  active?: boolean
}

/** Props for the grouped conversation history list. */
export interface ConversationHistoryProps {
  conversations?: ConversationHistoryItem[]
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}
