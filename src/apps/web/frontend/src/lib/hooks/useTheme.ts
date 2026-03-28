import { useContext } from 'react'
import { ThemeContext } from '$sections/theme/ThemeProvider'

/** Hook to access the current theme context values. */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
