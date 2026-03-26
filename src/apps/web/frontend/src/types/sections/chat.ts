export interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface ChatPanelProps {
  messages: Message[]
  isLoading?: boolean
}

export interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}

export interface InputPanelRef {
  focus: () => void
  clear: () => void
}
