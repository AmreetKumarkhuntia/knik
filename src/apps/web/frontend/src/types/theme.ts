/** Light or dark color mode. */
export type ThemeMode = 'dark' | 'light'

/** Named accent theme. */
export type ThemeName = 'purple' | 'blue' | 'teal' | 'cyan' | 'amber'

/** Layout density tweak. */
export type Density = 'comfortable' | 'compact'

/** Corner-radius tweak. */
export type Radius = 'sharp' | 'default' | 'round'

/** Complete set of color tokens for a theme. */
export interface ThemeColors {
  background: string
  surface: string
  surfaceGlass: string
  surfaceRaised: string
  canvas: string
  code: string
  text: string
  textSecondary: string
  textMuted: string
  textSubtle: string
  textInverse: string
  primary: string
  primaryHover: string
  accent: string
  accentHover: string
  border: string
  borderLight: string
  success: string
  error: string
  warning: string
  info: string
  shadow: string
  shadowSubtle: string
  nodeHandleBorder: string
}

/** A fully resolved theme with mode, name, and color tokens. */
export interface Theme {
  mode: ThemeMode
  name: ThemeName
  colors: ThemeColors
}

/** Shape of the theme context value. */
export interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  accentName: ThemeName
  density: Density
  radius: Radius
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: ThemeName) => void
  setDensity: (density: Density) => void
  setRadius: (radius: Radius) => void
}

/** Props for the theme selector dropdown. */
export interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
}
