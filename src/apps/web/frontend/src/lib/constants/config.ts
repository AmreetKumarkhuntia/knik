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
  input:
    'w-full bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all',

  controls: '!bg-surface !border-border !rounded-lg',
  miniMap: '!bg-surface !border-border',
  draggingCursor: 'cursor-copy',
}

export const STYLE_CONFIG = {
  cardVariants: {
    default: 'bg-surface border border-border rounded-lg shadow-sm',
    elevated: 'bg-surface border border-border rounded-lg shadow-lg',
    glass: 'glass border border-white/10 shadow-sm',
  },

  cardPadding: {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  },

  badgeTypes: {
    pro: {
      bg: 'bg-primary',
      text: 'text-white',
    },
    admin: {
      bg: 'bg-error',
      text: 'text-white',
    },
    basic: {
      bg: 'bg-surface',
      text: 'text-text',
    },
  },

  trendColors: {
    positive: {
      text: 'text-success',
      background: 'bg-success/10',
    },
    steady: {
      text: 'text-secondary',
      background: 'bg-white/5',
    },
    negative: {
      text: 'text-error',
      background: 'bg-error/10',
    },
  },

  statusColors: {
    active: {
      background: 'bg-success/10',
      text: 'text-success',
    },
  },

  // Canvas colors — import CANVAS_OVERLAY_COLORS from themes.ts for JS-only usage
  canvas: {
    background: 'rgba(255, 255, 255, 0.1)',
    nodeColor: 'rgba(255, 255, 255, 0.3)',
    maskColor: 'rgba(0, 0, 0, 0.8)',
  },
}
