import type { ThemeColors } from '../../types/theme'

// ---------------------------------------------------------------------------
// JS-only constants (used in React Flow / SVG / inline styles)
// These do not vary per theme — they are fixed semantic values.
// ---------------------------------------------------------------------------

export const EDGE_STATUS_COLORS = {
  default: '#6b7280', // gray-500  — pending / unknown
  failed: '#ef4444', //  red-500   — failed
  success: '#10b981', // emerald-500 — success
  running: '#3b82f6', // blue-500  — running
} as const

export const CANVAS_OVERLAY_COLORS = {
  dotGrid: 'rgba(255, 255, 255, 0.05)',
  minimapNode: 'rgba(255, 255, 255, 0.3)',
  minimapMask: 'rgba(0, 0, 0, 0.8)',
} as const

// ---------------------------------------------------------------------------
// Base palettes
// ---------------------------------------------------------------------------

export const darkThemeColors: ThemeColors = {
  // Backgrounds
  background: '#0A0A0A',
  surface: '#171717',
  surfaceGlass: 'rgba(23, 23, 23, 0.7)',
  surfaceRaised: '#1f1f1f',
  canvas: '#0d111a',
  code: '#1E1E1E',

  // Text
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  textSubtle: '#D4D4D4',
  textInverse: '#0A0A0A',

  // Brand
  primary: '#8B5CF6',
  primaryHover: '#A78BFA',
  accent: '#00d9f4',
  accentHover: '#00e5ff',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Shadows (JS-only — used in boxShadow inline styles)
  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowSubtle: 'rgba(0, 0, 0, 0.15)',

  // Graph / React Flow
  nodeHandleBorder: '#0d021f',
}

export const lightThemeColors: ThemeColors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',
  surfaceRaised: '#E5E5E5',
  canvas: '#EFEFEF',
  code: '#F0F0F0',

  // Text
  text: '#171717',
  textSecondary: '#737373',
  textMuted: '#A3A3A3',
  textSubtle: '#404040',
  textInverse: '#FAFAFA',

  // Brand
  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  accent: '#00d9f4',
  accentHover: '#00e5ff',

  // Borders
  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.2)',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowSubtle: 'rgba(0, 0, 0, 0.08)',

  // Graph / React Flow
  nodeHandleBorder: '#d4d4d4',
}

// ---------------------------------------------------------------------------
// Theme presets (dark)
// ---------------------------------------------------------------------------

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
}

// ---------------------------------------------------------------------------
// Theme presets (light)
// ---------------------------------------------------------------------------

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
}

export const DEFAULT_THEME = 'purple'
export const DEFAULT_MODE = 'dark' as const
