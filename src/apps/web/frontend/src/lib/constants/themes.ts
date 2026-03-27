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
  background: '#0A0A0A',
  surface: '#171717',
  surfaceGlass: 'rgba(23, 23, 23, 0.7)',
  surfaceRaised: '#1f1f1f',
  canvas: '#0d111a',
  code: '#1E1E1E',

  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  textSubtle: '#D4D4D4',
  textInverse: '#0A0A0A',

  primary: '#8B5CF6',
  primaryHover: '#A78BFA',
  accent: '#00d9f4',
  accentHover: '#00e5ff',

  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowSubtle: 'rgba(0, 0, 0, 0.15)',

  nodeHandleBorder: '#0d021f',
}

export const lightThemeColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',
  surfaceRaised: '#E5E5E5',
  canvas: '#EFEFEF',
  code: '#F0F0F0',

  text: '#171717',
  textSecondary: '#737373',
  textMuted: '#A3A3A3',
  textSubtle: '#404040',
  textInverse: '#FAFAFA',

  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  accent: '#00d9f4',
  accentHover: '#00e5ff',

  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.2)',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowSubtle: 'rgba(0, 0, 0, 0.08)',

  nodeHandleBorder: '#d4d4d4',
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
}

export const DEFAULT_THEME = 'purple'
export const DEFAULT_MODE = 'dark' as const
