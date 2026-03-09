// Configuration constants

// API configuration
export const API = {
  baseURL: 'http://localhost:8000',
  port: 8000,
  endpoints: {
    workflows: '/api/workflows',
    history: '/api/history',
    executionNodes: (workflowId: string, executionId: string) =>
      `/api/workflows/${workflowId}/executions/${executionId}/nodes`,
  },
}

// Storage keys
export const STORAGE = {
  themeMode: 'knik-theme-mode',
  themeAccent: 'knik-theme-accent',
}

// CSS variables
export const CSS_VARS = {
  backgroundColor: '--color-background',
  surfaceColor: '--color-surface',
  surfaceGlassColor: '--color-surface-glass',
  textColor: '--color-text',
  textSecondaryColor: '--color-text-secondary',
  primaryColor: '--color-primary',
  primaryHoverColor: '--color-primary-hover',
  borderColor: '--color-border',
  borderLightColor: '--color-border-light',
  successColor: '--color-success',
  errorColor: '--color-error',
}

// CSS class names
export const CSS_CLASSES = {
  // FormField
  input:
    'w-full bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all',

  // Canvas
  controls: '!bg-surface !border-border !rounded-lg',
  miniMap: '!bg-surface !border-border',
  draggingCursor: 'cursor-copy',
}

// Style configuration
export const STYLE_CONFIG = {
  // Card variants
  cardVariants: {
    default: 'bg-surface border border-border rounded-lg shadow-sm',
    elevated: 'bg-surface border border-border rounded-lg shadow-lg',
    glass: 'glass border border-white/10 shadow-sm',
  },

  // Card padding
  cardPadding: {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  },

  // Badge types
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

  // Trend colors
  trendColors: {
    positive: {
      text: 'text-teal-400',
      background: 'bg-teal-500/10',
    },
    steady: {
      text: 'text-slate-400',
      background: 'bg-white/5',
    },
    negative: {
      text: 'text-rose-400',
      background: 'bg-rose-500/10',
    },
  },

  // Status colors
  statusColors: {
    active: {
      background: 'bg-teal-500/10',
      text: 'text-teal-400',
    },
  },

  // Canvas colors
  canvas: {
    background: 'rgba(255,255,255,0.1)',
    nodeColor: 'rgba(255,255,255,0.3)',
    maskColor: 'rgba(0,0,0,0.8)',
  },
}

// Workflow activity icons
export const ACTIVITY_ICONS = {
  created: { icon: '📝', color: 'text-blue-400' },
  updated: { icon: '🔄', color: 'text-yellow-400' },
  executed: { icon: '▶️', color: 'text-green-400' },
  failed: { icon: '❌', color: 'text-red-400' },
  completed: { icon: '✅', color: 'text-green-400' },
  scheduled: { icon: '⏰', color: 'text-purple-400' },
}
