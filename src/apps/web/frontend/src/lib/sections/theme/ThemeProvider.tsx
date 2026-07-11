/* eslint-disable @typescript-eslint/no-unnecessary-condition */
'use client'

import { useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from '$hooks/useTheme'
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  DEFAULT_DENSITY,
  DEFAULT_RADIUS,
  themePresets,
  lightThemePresets,
  ACCENT_VARS,
  RADIUS_PRESETS,
  DENSITY_PRESETS,
} from '$lib/constants/themes'
import type { Theme, ThemeMode, ThemeName, Density, Radius } from '$types/theme'

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

  const [density, setDensityState] = useState<Density>(() => {
    try {
      return (localStorage.getItem('knik-theme-density') as Density) ?? DEFAULT_DENSITY
    } catch {
      return DEFAULT_DENSITY
    }
  })

  const [radius, setRadiusState] = useState<Radius>(() => {
    try {
      return (localStorage.getItem('knik-theme-radius') as Radius) ?? DEFAULT_RADIUS
    } catch {
      return DEFAULT_RADIUS
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

  // Tweak vars: accent (--acc*), corner radius (--r-*), and density (--pad-card).
  // These drive the redesign's accent-styled surfaces and keep --primary in sync.
  useEffect(() => {
    const root = document.documentElement
    const acc = ACCENT_VARS[accentName] ?? ACCENT_VARS.cyan
    const r = RADIUS_PRESETS[radius] ?? RADIUS_PRESETS.default
    const d = DENSITY_PRESETS[density] ?? DENSITY_PRESETS.comfortable

    root.style.setProperty('--acc', acc.acc)
    root.style.setProperty('--acc-text', acc.text)
    root.style.setProperty('--acc-soft', acc.soft)
    root.style.setProperty('--acc-border', acc.border)
    root.style.setProperty('--acc-glow', acc.glow)
    root.style.setProperty('--acc-blob', acc.blob)

    root.style.setProperty('--primary', acc.acc)
    root.style.setProperty('--primary-soft', acc.soft)
    root.style.setProperty('--border-focus', acc.acc)

    root.style.setProperty('--r-btn', r.btn)
    root.style.setProperty('--r-card', r.card)
    root.style.setProperty('--pad-card', d.padCard)
  }, [accentName, radius, density])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('knik-theme-mode', newMode)
  }

  const setAccent = (newAccent: ThemeName) => {
    setAccentState(newAccent)
    localStorage.setItem('knik-theme-accent', newAccent)
  }

  const setDensity = (newDensity: Density) => {
    setDensityState(newDensity)
    localStorage.setItem('knik-theme-density', newDensity)
  }

  const setRadius = (newRadius: Radius) => {
    setRadiusState(newRadius)
    localStorage.setItem('knik-theme-radius', newRadius)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        accentName,
        density,
        radius,
        setMode,
        setAccent,
        setDensity,
        setRadius,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
