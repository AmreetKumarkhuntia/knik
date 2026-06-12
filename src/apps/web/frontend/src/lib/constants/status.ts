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
    bg: 'bg-[var(--warning-bg)]',
    text: 'text-[var(--warning)]',
    label: 'Pending',
    hex: EDGE_STATUS_COLORS.default,
  },
  running: {
    bg: 'bg-[var(--info-bg)]',
    text: 'text-[var(--info)]',
    label: 'Running',
    hex: EDGE_STATUS_COLORS.running,
  },
  success: {
    bg: 'bg-[var(--success-bg)]',
    text: 'text-[var(--success)]',
    label: 'Success',
    hex: EDGE_STATUS_COLORS.success,
  },
  failed: {
    bg: 'bg-[var(--danger-bg)]',
    text: 'text-[var(--danger)]',
    label: 'Failed',
    hex: EDGE_STATUS_COLORS.failed,
  },
}
