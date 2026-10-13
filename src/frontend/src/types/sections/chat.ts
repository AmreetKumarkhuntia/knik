import type { ChatModelOption } from '$types/components/chat'

/** Props for the chat input panel. */
export interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  /** A reply is arriving: Send becomes Stop and Enter no longer sends. */
  isStreaming?: boolean
  onStop?: () => void
  model?: string
  onModel?: (id: string) => void
  models?: ChatModelOption[]
  onOpenTools?: () => void
  toolsOpen?: boolean
}

/** Imperative handle exposed by the input panel via ref. */
export interface InputPanelRef {
  focus: () => void
  clear: () => void
}
