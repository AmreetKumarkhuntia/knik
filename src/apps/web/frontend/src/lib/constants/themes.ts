export const EDGE_STATUS_COLORS = {
  default: 'var(--color-text-muted)',
  failed: 'var(--color-error)',
  success: 'var(--color-success)',
  running: 'var(--color-info)',
} as const

export const CANVAS_OVERLAY_COLORS = {
  dotGrid: 'var(--graph-grid)',
  minimapNode: 'var(--graph-minimap-node)',
  minimapMask: 'var(--graph-minimap-mask)',
} as const

export const DEFAULT_MODE = 'dark' as const
