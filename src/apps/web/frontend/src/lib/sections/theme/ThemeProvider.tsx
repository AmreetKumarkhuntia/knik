/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-unnecessary-condition */
'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_MODE, DEFAULT_THEME, themePresets, lightThemePresets } from '$lib/constants/themes'
import type { Theme, ThemeMode, ThemeName, ThemeContextType } from '$types/theme'

/** React context providing the current theme mode, accent, and setter functions. */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/** Provider component that manages theme mode and accent with localStorage persistence. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem('knik-theme-mode') as ThemeMode) ?? DEFAULT_MODE
    } catch {
      return DEFAULT_MODE
    }
  })

  const [accentName, setAccentState] = useState<ThemeName>(() => {
    try {
      return (localStorage.getItem('knik-theme-accent') as ThemeName) ?? DEFAULT_THEME
    } catch {
      return DEFAULT_THEME
    }
  })

  const theme: Theme = useMemo(
    () => ({
      mode,
      name: accentName,
      colors: mode === 'dark' ? themePresets[accentName] : lightThemePresets[accentName],
    }),
    [mode, accentName]
  )

  useEffect(() => {
    const root = document.documentElement
    const colors = theme.colors

    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-surface-glass', colors.surfaceGlass)
    root.style.setProperty('--color-surface-raised', colors.surfaceRaised)
    root.style.setProperty('--color-canvas', colors.canvas)
    root.style.setProperty('--color-code', colors.code)

    root.style.setProperty('--color-text', colors.text)
    root.style.setProperty('--color-text-secondary', colors.textSecondary)
    root.style.setProperty('--color-text-muted', colors.textMuted)
    root.style.setProperty('--color-text-subtle', colors.textSubtle)
    root.style.setProperty('--color-text-inverse', colors.textInverse)

    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-hover', colors.primaryHover)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-accent-hover', colors.accentHover)

    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-border-light', colors.borderLight)

    root.style.setProperty('--color-success', colors.success)
    root.style.setProperty('--color-error', colors.error)
    root.style.setProperty('--color-warning', colors.warning)
    root.style.setProperty('--color-info', colors.info)

    root.style.setProperty('--color-shadow', colors.shadow)
    root.style.setProperty('--color-shadow-subtle', colors.shadowSubtle)

    root.setAttribute('data-theme', mode)
  }, [theme, mode])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('knik-theme-mode', newMode)
  }

  const setAccent = (newAccent: ThemeName) => {
    setAccentState(newAccent)
    localStorage.setItem('knik-theme-accent', newAccent)
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, accentName, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook to access the current theme context values. */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
