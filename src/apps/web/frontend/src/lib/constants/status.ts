import type { ExecutionStatus } from '$types/workflow'

export const executionStatusConfig: Record<
  ExecutionStatus,
  {
    bg: string
    text: string
    label: string
  }
> = {
  pending: {
    bg: 'bg-[var(--warning-bg)]',
    text: 'text-[var(--warning)]',
    label: 'Pending',
  },
  running: {
    bg: 'bg-[var(--info-bg)]',
    text: 'text-[var(--info)]',
    label: 'Running',
  },
  success: {
    bg: 'bg-[var(--success-bg)]',
    text: 'text-[var(--success)]',
    label: 'Success',
  },
  failed: {
    bg: 'bg-[var(--danger-bg)]',
    text: 'text-[var(--danger)]',
    label: 'Failed',
  },
}
