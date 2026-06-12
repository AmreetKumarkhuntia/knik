export const API = {
  baseURL: 'http://localhost:8000',
  port: 8000,
  endpoints: {
    workflows: '/api/workflows',
    history: '/api/history',
    conversations: '/api/conversations',
    executionNodes: (workflowId: string, executionId: string) =>
      `/api/workflows/${workflowId}/executions/${executionId}/nodes`,
  },
}

export const STORAGE = {
  themeMode: 'knik-theme-mode',
  themeAccent: 'knik-theme-accent',
}

export const CSS_VARS = {
  backgroundColor: '--color-background',
  surfaceColor: '--color-surface',
  surfaceGlassColor: '--color-surface-glass',
  surfaceRaisedColor: '--color-surface-raised',
  canvasColor: '--color-canvas',
  codeColor: '--color-code',
  textColor: '--color-text',
  textSecondaryColor: '--color-text-secondary',
  textMutedColor: '--color-text-muted',
  textSubtleColor: '--color-text-subtle',
  textInverseColor: '--color-text-inverse',
  primaryColor: '--color-primary',
  primaryHoverColor: '--color-primary-hover',
  borderColor: '--color-border',
  borderLightColor: '--color-border-light',
  successColor: '--color-success',
  errorColor: '--color-error',
  warningColor: '--color-warning',
  infoColor: '--color-info',
}

export const CSS_CLASSES = {
  input: 'knik-input w-full disabled:opacity-50 disabled:cursor-not-allowed',

  controls: '!bg-[var(--bg-surface-2)] !border-[var(--border-2)] !rounded-md',
  miniMap: '!bg-[var(--bg-surface-2)] !border-[var(--border-2)]',
  draggingCursor: 'cursor-copy',
}

export const STYLE_CONFIG = {
  cardVariants: {
    default: 'knik-card',
    elevated: 'knik-card shadow-knik-2',
    glass: 'knik-card--glass',
  },

  cardPadding: {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  },

  badgeTypes: {
    pro: {
      bg: 'bg-[var(--primary)]',
      text: 'text-[var(--on-primary)]',
    },
    admin: {
      bg: 'bg-[var(--danger)]',
      text: 'text-white',
    },
    basic: {
      bg: 'bg-surface-3',
      text: 'text-fg-2',
    },
  },

  trendColors: {
    positive: {
      text: 'text-[var(--success)]',
      background: 'bg-[var(--success-bg)]',
    },
    steady: {
      text: 'text-fg-3',
      background: 'bg-[var(--bg-surface-3)]',
    },
    negative: {
      text: 'text-[var(--danger)]',
      background: 'bg-[var(--danger-bg)]',
    },
  },

  statusColors: {
    active: {
      background: 'bg-[var(--success-bg)]',
      text: 'text-[var(--success)]',
    },
  },

  // Canvas colors — import CANVAS_OVERLAY_COLORS from themes.ts for JS-only usage
  canvas: {
    background: 'rgba(255, 255, 255, 0.1)',
    nodeColor: 'rgba(255, 255, 255, 0.3)',
    maskColor: 'rgba(0, 0, 0, 0.8)',
  },
}
