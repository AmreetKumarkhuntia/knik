import type { ThemeColors } from '../../types/theme'

export const EDGE_STATUS_COLORS = {
  default: '#6b7280',
  failed: '#ef4444',
  success: '#10b981',
  running: '#3b82f6',
} as const

export const CANVAS_OVERLAY_COLORS = {
  dotGrid: 'rgba(255, 255, 255, 0.05)',
  minimapNode: 'rgba(255, 255, 255, 0.3)',
  minimapMask: 'rgba(0, 0, 0, 0.8)',
} as const

export const darkThemeColors: ThemeColors = {
  background: '#07090d',
  surface: '#0d1117',
  surfaceGlass: 'rgba(15, 20, 28, 0.66)',
  surfaceRaised: '#11161f',
  canvas: '#08101a',
  code: '#0c1118',

  text: '#f6f8fb',
  textSecondary: '#9aa6b6',
  textMuted: '#6a7585',
  textSubtle: '#d6dde7',
  textInverse: '#07090d',

  primary: '#8B5CF6',
  primaryHover: '#A78BFA',
  accent: '#00d9f4',
  accentHover: '#34d3ee',

  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.18)',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowSubtle: 'rgba(0, 0, 0, 0.15)',

  nodeHandleBorder: '#082b36',
}

export const lightThemeColors: ThemeColors = {
  background: '#fdfdfd',
  surface: '#ffffff',
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',
  surfaceRaised: '#f5f6f8',
  canvas: '#f0f2f5',
  code: '#f1f3f5',

  text: '#0b0f14',
  textSecondary: '#5b6677',
  textMuted: '#8893a3',
  textSubtle: '#1d2530',
  textInverse: '#ffffff',

  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  accent: '#00b8d4',
  accentHover: '#008faa',

  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.18)',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowSubtle: 'rgba(0, 0, 0, 0.08)',

  nodeHandleBorder: '#b5bdc8',
}

export const themePresets: Record<string, ThemeColors> = {
  purple: {
    ...darkThemeColors,
    primary: '#8B5CF6',
    primaryHover: '#A78BFA',
  },
  blue: {
    ...darkThemeColors,
    primary: '#3B82F6',
    primaryHover: '#60A5FA',
  },
  teal: {
    ...darkThemeColors,
    primary: '#14B8A6',
    primaryHover: '#2DD4BF',
  },
  cyan: {
    ...darkThemeColors,
    primary: '#00d9f4',
    primaryHover: '#34d3ee',
  },
  amber: {
    ...darkThemeColors,
    primary: '#f59e0b',
    primaryHover: '#fbbf24',
  },
}

export const lightThemePresets: Record<string, ThemeColors> = {
  purple: {
    ...lightThemeColors,
    primary: '#8B5CF6',
    primaryHover: '#A78BFA',
  },
  blue: {
    ...lightThemeColors,
    primary: '#3B82F6',
    primaryHover: '#60A5FA',
  },
  teal: {
    ...lightThemeColors,
    primary: '#14B8A6',
    primaryHover: '#2DD4BF',
  },
  cyan: {
    ...lightThemeColors,
    primary: '#00b8d4',
    primaryHover: '#008faa',
  },
  amber: {
    ...lightThemeColors,
    primary: '#d97706',
    primaryHover: '#f59e0b',
  },
}

/**
 * Accent CSS-variable sets driven onto the document root by ThemeProvider.
 * Mirrors the redesign prototype's ACCENTS map: --acc / --acc-text / --acc-soft
 * / --acc-border / --acc-glow / --acc-blob power every accent-styled surface.
 */
export interface AccentVars {
  acc: string
  text: string
  soft: string
  border: string
  glow: string
  blob: string
}

export const ACCENT_VARS: Record<string, AccentVars> = {
  cyan: {
    acc: '#00d9f4',
    text: '#34d3ee',
    soft: 'rgba(0, 217, 244, 0.12)',
    border: 'rgba(0, 217, 244, 0.42)',
    glow: 'rgba(0, 217, 244, 0.55)',
    blob: 'rgba(0, 217, 244, 0.16)',
  },
  teal: {
    acc: '#14b8a6',
    text: '#2dd4bf',
    soft: 'rgba(20, 184, 166, 0.13)',
    border: 'rgba(20, 184, 166, 0.42)',
    glow: 'rgba(20, 184, 166, 0.5)',
    blob: 'rgba(20, 184, 166, 0.16)',
  },
  purple: {
    acc: '#8b5cf6',
    text: '#a78bfa',
    soft: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.42)',
    glow: 'rgba(139, 92, 246, 0.5)',
    blob: 'rgba(139, 92, 246, 0.16)',
  },
  blue: {
    acc: '#3b82f6',
    text: '#60a5fa',
    soft: 'rgba(59, 130, 246, 0.13)',
    border: 'rgba(59, 130, 246, 0.42)',
    glow: 'rgba(59, 130, 246, 0.5)',
    blob: 'rgba(59, 130, 246, 0.16)',
  },
  amber: {
    acc: '#f59e0b',
    text: '#fbbf24',
    soft: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.42)',
    glow: 'rgba(245, 158, 11, 0.5)',
    blob: 'rgba(245, 158, 11, 0.16)',
  },
}

/** Corner-radius presets → --r-btn / --r-card (mirrors prototype RADII). */
export const RADIUS_PRESETS = {
  sharp: { btn: '4px', card: '7px' },
  default: { btn: '8px', card: '12px' },
  round: { btn: '12px', card: '18px' },
} as const

/** Layout density → --pad-card (mirrors prototype density tweak). */
export const DENSITY_PRESETS = {
  comfortable: { padCard: '18px' },
  compact: { padCard: '13px' },
} as const

export const DEFAULT_THEME = 'cyan'
export const DEFAULT_MODE = 'dark' as const
export const DEFAULT_DENSITY = 'comfortable' as const
export const DEFAULT_RADIUS = 'default' as const
