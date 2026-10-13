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
    bg: 'bg-panel-2',
    text: 'text-fg-2',
    label: 'Pending',
  },
  running: {
    bg: 'bg-[var(--acc-soft)]',
    text: 'text-[var(--acc-text)]',
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
