import type { ExecutionStatus } from '$types/workflow'

export const executionStatusConfig: Record<
  ExecutionStatus,
  {
    bg: string
    text: string
    label: string
  }
> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
  running: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Running' },
  success: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Success' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
}
