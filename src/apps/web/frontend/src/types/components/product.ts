import type { NodeExecutionStep, WorkflowDefinition } from '$types/workflow'

/** Props for an execution timeline visualization. */
export interface ExecutionTimelineProps {
  timeline: NodeExecutionStep[] | undefined
  onCopy?: (text: string) => void
}

/** The caller supplies the session definition and graph container dimensions. */
export interface ExecutionFlowGraphProps {
  className?: string
  definition: WorkflowDefinition | null
  definitionError?: string | null
  timeline: NodeExecutionStep[]
}
