export const EDGE_STATUS_COLORS = {
  default: 'var(--fg-4)',
  failed: 'var(--danger)',
  success: 'var(--success)',
  running: 'var(--info)',
} as const

export const CANVAS_OVERLAY_COLORS = {
  dotGrid: 'var(--graph-grid)',
  minimapNode: 'var(--graph-minimap-node)',
  minimapMask: 'var(--graph-minimap-mask)',
} as const

export const DEFAULT_MODE = 'dark' as const
