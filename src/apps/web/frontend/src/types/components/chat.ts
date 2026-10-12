import type * as React from 'react'
import type { ToolCall } from '$types/conversation'

export type AccentBadge = 'primary' | 'teal' | 'violet' | 'success'

/** Props for a markdown message renderer. */
export interface MarkdownMessageProps {
  content: string
  isStreaming?: boolean
  onCopy?: (text: string) => void
}

export interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: React.ReactNode
  avatar?: React.ReactNode
  header?: React.ReactNode
  reasoning?: React.ReactNode
  onCopy?: () => void
}

export interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  copyable?: boolean
  copied?: boolean
  onCopy?: (text: string) => void
  className?: string
}

export interface JsonViewerProps {
  data: unknown
  tabs?: string[]
  copyable?: boolean
  copied?: boolean
  onCopy?: (text: string) => void
  className?: string
}

/** A selectable model in the composer picker. Optional fields render only when present. */
export interface ChatModelOption {
  id: string
  label: string
  vendor?: string
  tag?: string
  badge?: AccentBadge
}

export interface ModelPickerProps {
  model: string
  onChange: (id: string) => void
  compact?: boolean
  models: ChatModelOption[]
}

export interface ToolCallCardProps {
  call: ToolCall
  /** Error cards open by default. */
  defaultExpanded?: boolean
  className?: string
}

export interface ToolCallListProps {
  calls: ToolCall[]
  /** The reply is still working before its first word: shows "Thinking…" even with no calls yet. */
  isThinking?: boolean
  className?: string
}
