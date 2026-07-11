import { createContext, useContext } from 'react'
import type { ThemeContextType } from '$types/theme'

/** React context providing the current theme mode, accent, and setter functions. */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/** Hook to access the current theme context values. */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
