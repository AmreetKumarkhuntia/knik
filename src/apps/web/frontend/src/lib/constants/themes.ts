import type { ThemeColors } from '../../types/theme'

export const darkThemeColors: ThemeColors = {
  background: '#0A0A0A',
  surface: '#171717',
  surfaceGlass: 'rgba(23, 23, 23, 0.7)',
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  primary: '#8B5CF6',
  primaryHover: '#A78BFA',
  accent: '#00d9f4',
  accentHover: '#00e5ff',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  success: '#10B981',
  error: '#EF4444',
}

export const lightThemeColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',
  text: '#171717',
  textSecondary: '#737373',
  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  accent: '#00d9f4',
  accentHover: '#00e5ff',
  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.2)',
  success: '#10B981',
  error: '#EF4444',
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
