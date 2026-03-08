export type ThemeMode = 'dark' | 'light'
export type ThemeName = 'purple' | 'blue' | 'teal'

export interface ThemeColors {
  background: string
  surface: string
  surfaceGlass: string
  text: string
  textSecondary: string
  primary: string
  primaryHover: string
  accent: string
  accentHover: string
  border: string
  borderLight: string
  success: string
  error: string
}

export interface Theme {
  mode: ThemeMode
  name: ThemeName
  colors: ThemeColors
}

export interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  accentName: ThemeName
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: ThemeName) => void
}
