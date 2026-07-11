import type * as React from 'react'
import type { AccentBadge } from '$lib/constants/redesignData'

/** Props for a markdown message renderer. */
export interface MarkdownMessageProps {
  content: string
  isStreaming?: boolean
}

/** Props for a markdown code block renderer. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CodeProps = any & {
  _node: unknown
  inline: boolean
  className: string
  children: unknown
}

export interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: React.ReactNode
  timestamp?: string
  actions?: {
    copy?: () => void
    thumbsUp?: () => void
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
  className?: string
}

export interface JsonViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  tabs?: string[]
  copyable?: boolean
  className?: string
}

/** Pure mic-button UI props; capture state comes from $hooks/useMicRecorder. */
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
}
