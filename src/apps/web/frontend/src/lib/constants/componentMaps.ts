/**
 * Static lookup maps for design-system components, relocated from co-located
 * .tsx files to satisfy the configs-live-in-constants/ boundary (eslint.config.js).
 */
import type { BannerProps, ModalSize } from '$types'
import type { AccentBadge } from '$types/components/chat'
import type { ToolCallKind, ToolCallStatus } from '$types/conversation'

/** Modal max-width class per size (Modal). */
export const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-[420px]',
  md: 'max-w-[460px]',
  lg: 'max-w-[560px]',
}

/** Accent dot color per model badge (ModelPicker). */
export const MODEL_ACCENT_DOT: Record<AccentBadge, string> = {
  primary: 'var(--acc, var(--aurora-400))',
  teal: 'var(--teal-400)',
  violet: 'var(--violet-400)',
  success: 'var(--success)',
}

/** Live-region role per banner variant; only urgent variants interrupt (Banner). */
export const BANNER_ROLE: Record<NonNullable<BannerProps['variant']>, 'alert' | 'status'> = {
  danger: 'alert',
  warning: 'alert',
  info: 'status',
  success: 'status',
}

/** Default Material Symbols icon per banner variant; an explicit `icon` prop wins (Banner). */
export const BANNER_ICON: Record<NonNullable<BannerProps['variant']>, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
}

/** Icon, label and plural nouns per tool call kind (ToolCallCard, ToolCallList). */
export const TOOL_CALL_KINDS: Record<
  ToolCallKind,
  { icon: string; label: string; nouns: [string, string] }
> = {
  tool: { icon: 'build', label: 'Tool', nouns: ['tool', 'tools'] },
  skill: { icon: 'auto_awesome', label: 'Skill', nouns: ['skill', 'skills'] },
  mcp: { icon: 'hub', label: 'MCP', nouns: ['MCP call', 'MCP calls'] },
}

/** Screen-reader status per tool call state (ToolCallCard). */
export const TOOL_CALL_STATUS_LABELS: Record<ToolCallStatus, string> = {
  running: 'Running',
  success: 'Done',
  error: 'Failed',
}

/** Material Symbols icon per MCP tool group (ToolGroupList); unknown groups use TOOL_GROUP_FALLBACK_ICON. */
export const TOOL_GROUP_ICONS: Record<string, string> = {
  shell: 'terminal',
  filesystem: 'folder',
  github: 'code',
  browser: 'public',
  gmail: 'mail',
  slack: 'tag',
  calendar: 'calendar_month',
}

export const TOOL_GROUP_FALLBACK_ICON = 'extension'
