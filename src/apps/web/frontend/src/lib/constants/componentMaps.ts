/**
 * Static lookup maps for design-system components, relocated from co-located
 * .tsx files to satisfy the configs-live-in-constants/ boundary (eslint.config.js).
 */
import type { ModalSize } from '$types'
import type { AccentBadge } from '$types/components/chat'
import type { ExecutionStatus } from '$types/workflow'

/** Modal max-width class per size (Modal). */
export const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

/** Accent dot color per model badge (ModelPicker). */
export const MODEL_ACCENT_DOT: Record<AccentBadge, string> = {
  primary: 'var(--acc, var(--aurora-400))',
  teal: 'var(--teal-400)',
  violet: 'var(--violet-400)',
  success: 'var(--success)',
}

/** Status icon + color per run status (WorkflowHub executions feed). */
export const HUB_EXEC_ICON: Record<ExecutionStatus, { name: string; color: string }> = {
  success: { name: 'check_circle', color: 'var(--success)' },
  failed: { name: 'cancel', color: 'var(--danger)' },
  running: { name: 'pending', color: 'var(--info)' },
  pending: { name: 'pending', color: 'var(--info)' },
}
