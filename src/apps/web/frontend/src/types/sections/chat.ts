import type { Message } from '$types/hooks'

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
