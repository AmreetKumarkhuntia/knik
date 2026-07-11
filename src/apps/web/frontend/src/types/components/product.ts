import type { ReactNode } from 'react'
import type { NodeExecutionStep, WorkflowDefinition } from '$types/workflow'

/** Props for an execution timeline visualization. */
export interface ExecutionTimelineProps {
  timeline: NodeExecutionStep[] | undefined
  loading?: boolean
}

/** Props for an execution flow graph visualization. The workflow definition is
 *  fetched by the consuming page and passed in; `null` renders the loading state. */
export interface ExecutionFlowGraphProps {
  definition: WorkflowDefinition | null
  definitionError?: string | null
  timeline: NodeExecutionStep[]
}

export interface McpTool {
  id: string
  name: string
  desc: string
  category: 'shell' | 'file' | 'browser' | 'cron' | 'text' | string
  icon: string
}

export interface McpToolsPanelProps {
  tools: McpTool[]
  onToggle?: (id: string) => void
  className?: string
}

export interface NotificationItem {
  id: string
  type: 'success' | 'fail' | 'info' | 'user'
  title: ReactNode
  time: string
  unread: boolean
}

export interface NotificationFeedProps {
  notifications: NotificationItem[]
  onDismiss: (id: string) => void
  onMarkRead: () => void
  className?: string
}
