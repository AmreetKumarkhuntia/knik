import type * as React from 'react'

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
  timestamp?: string
  avatar?: React.ReactNode
  header?: React.ReactNode
  reasoning?: React.ReactNode
  actionContent?: React.ReactNode
  actions?: {
    copy?: () => void
    thumbsUp?: () => void
    thumbsDown?: () => void
    retry?: () => void
  }
  className?: string
}

export interface AgentThinkingStep {
  type: 'thinking' | 'tool_call' | 'diff'
  content: string
}

export interface AgentThinkingProps {
  steps: AgentThinkingStep[]
  defaultExpanded?: boolean
  className?: string
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

/** Pure mic-button UI props. */
export interface MicRecorderProps {
  recording: boolean
  seconds: number
  maxDuration?: number // in seconds
  onStart: () => void
  onStop: () => void
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

export interface TTSPlayerProps {
  voiceName: string
  text: string
  /** Playback progress as a fraction of the waveform, 0–1 (clamped). */
  progress: number
  className?: string
}

export interface Voice {
  id: string
  name: string
  lang: string
  tags: string[]
  gradient: string
}

export interface VoicePickerProps {
  voices: Voice[]
  selected: string
  onSelect: (id: string) => void
  className?: string
}

/** Props for a structured input/output viewer. */
export interface StructuredOutputProps {
  inputs: Record<string, unknown> | undefined
  outputs: Record<string, unknown> | undefined
  loading: boolean
  onCopy?: (text: string) => void
  copied?: boolean
}
