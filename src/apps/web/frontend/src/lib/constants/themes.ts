export const EDGE_STATUS_COLORS = {
  default: 'var(--border-strong)',
  failed: 'var(--danger)',
  success: 'color-mix(in srgb, var(--success) 60%, transparent)',
  running: 'var(--primary)',
} as const

export const CANVAS_OVERLAY_COLORS = {
  dotGrid: 'var(--graph-grid)',
  minimapNode: 'var(--graph-minimap-node)',
  minimapMask: 'var(--graph-minimap-mask)',
} as const

export const DEFAULT_MODE = 'dark' as const
