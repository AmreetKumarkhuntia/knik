import type { ExecutionStatus } from '$types/workflow'
import { EDGE_STATUS_COLORS } from '$lib/constants/themes'

export { EDGE_STATUS_COLORS }

export const executionStatusConfig: Record<
  ExecutionStatus,
  {
    bg: string
    text: string
    label: string
    hex: string
  }
> = {
  pending: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    label: 'Pending',
    hex: EDGE_STATUS_COLORS.default,
  },
  running: {
    bg: 'bg-info/20',
    text: 'text-info',
    label: 'Running',
    hex: EDGE_STATUS_COLORS.running,
  },
  success: {
    bg: 'bg-success/20',
    text: 'text-success',
    label: 'Success',
    hex: EDGE_STATUS_COLORS.success,
  },
  failed: {
    bg: 'bg-error/20',
    text: 'text-error',
    label: 'Failed',
    hex: EDGE_STATUS_COLORS.failed,
  },
}
