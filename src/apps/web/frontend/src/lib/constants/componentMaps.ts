/**
 * Static lookup maps for design-system components, relocated from co-located
 * .tsx files to satisfy the configs-live-in-constants/ boundary (eslint.config.js).
 */
import type { ModalSize } from '$types'
import type { AccentBadge, RunStatus } from './redesignData'

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

/** Gradient class per voice swatch id (VoicePicker). */
export const VOICE_GRADIENTS: Record<string, string> = {
  'g-rose': 'bg-gradient-to-br from-pink-500 to-pink-700',
  'g-amber': 'bg-gradient-to-br from-amber-500 to-amber-700',
  'g-aurora': 'bg-gradient-to-br from-[var(--aurora-400)] to-teal-500',
  'g-violet': 'bg-gradient-to-br from-violet-400 to-violet-600',
  'g-emerald': 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'g-sky': 'bg-gradient-to-br from-sky-400 to-sky-600',
  'g-slate': 'bg-gradient-to-br from-slate-400 to-slate-600',
  'g-zinc': 'bg-gradient-to-br from-zinc-300 to-zinc-500',
  'g-stone': 'bg-gradient-to-br from-stone-300 to-stone-500',
}

/** Pill style per MCP tool category (McpToolsPanel). */
export const MCP_CATEGORY_STYLES: Record<string, string> = {
  shell: 'bg-[color-mix(in_srgb,var(--teal-500)_14%,transparent)] text-[var(--teal-300)]',
  file: 'bg-[color-mix(in_srgb,var(--violet-500)_14%,transparent)] text-[var(--violet-400)]',
  browser: 'bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]',
  cron: 'bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--aurora-300)]',
  // No system token for pink; kept as a raw accent for this category.
  text: 'bg-[rgba(236,72,153,0.14)] text-[#ec4899]',
}

/** Metric-card color per demo metric color key (WorkflowHub). */
export const HUB_METRIC_COLOR: Record<string, 'primary' | 'teal' | 'rose' | 'blue'> = {
  primary: 'primary',
  teal: 'teal',
  success: 'teal',
  violet: 'blue',
}

/** Trend direction per demo trend dir (WorkflowHub). */
export const HUB_TREND_DIR: Record<string, 'up' | 'down' | 'neutral'> = {
  up: 'up',
  down: 'down',
  flat: 'neutral',
}

/** Status icon + color per run status (WorkflowHub executions feed). */
export const HUB_EXEC_ICON: Record<RunStatus, { name: string; color: string }> = {
  success: { name: 'check_circle', color: 'var(--success)' },
  failed: { name: 'cancel', color: 'var(--danger)' },
  running: { name: 'pending', color: 'var(--info)' },
  pending: { name: 'pending', color: 'var(--info)' },
}
