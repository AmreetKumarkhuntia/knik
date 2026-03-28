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
}

/** Props for the chat input panel. */
export interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

/** Imperative handle exposed by the input panel via ref. */
export interface InputPanelRef {
  focus: () => void
  clear: () => void
}
