export const EDGE_STATUS_COLORS = {
  default: 'var(--border-3)',
  failed: 'var(--danger)',
  // 75% keeps the prototype's softened done edge while still reaching 3:1 on the light canvas.
  success: 'color-mix(in srgb, var(--success) 75%, transparent)',
  running: 'var(--primary)',
} as const

export const CANVAS_OVERLAY_COLORS = {
  dotGrid: 'var(--graph-grid)',
  minimapNode: 'var(--graph-minimap-node)',
  minimapNodeSelected: 'var(--primary)',
  minimapMask: 'var(--graph-minimap-mask)',
} as const

export const DEFAULT_MODE = 'dark' as const
