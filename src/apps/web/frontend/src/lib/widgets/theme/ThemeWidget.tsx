import { useEffect } from 'react'
import { useDemoSession } from '$widgets/session/useDemoSession'
import {
  themePresets,
  lightThemePresets,
  ACCENT_VARS,
  RADIUS_PRESETS,
  DENSITY_PRESETS,
} from '$lib/constants/themes'
import type { MainLayoutWidgetProps } from '$types/widgets/chat-shell'

export default function ThemeWidget({ children }: MainLayoutWidgetProps) {
  const appearance = useDemoSession(state => state.appearance)

  useEffect(() => {
    const { mode, accentName, radius, density } = appearance
    const colors = mode === 'dark' ? themePresets[accentName] : lightThemePresets[accentName]
    const accent = ACCENT_VARS[accentName]
    const corners = RADIUS_PRESETS[radius]
    const spacing = DENSITY_PRESETS[density]
    const root = document.documentElement
    const previousTheme = root.getAttribute('data-theme')
    const previous = new Map<string, string>()
    const set = (name: string, value: string) => {
      previous.set(name, root.style.getPropertyValue(name))
      root.style.setProperty(name, value)
    }

    for (const [name, value] of Object.entries(colors)) {
      set(`--color-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value)
    }
    set('--acc', accent.acc)
    set('--acc-text', accent.text)
    set('--acc-soft', accent.soft)
    set('--acc-border', accent.border)
    set('--acc-glow', accent.glow)
    set('--acc-blob', accent.blob)
    set('--primary', accent.acc)
    set('--primary-soft', accent.soft)
    set('--border-focus', accent.acc)
    set('--r-btn', corners.btn)
    set('--r-card', corners.card)
    set('--pad-card', spacing.padCard)
    root.setAttribute('data-theme', mode)

    return () => {
      for (const [name, value] of previous) {
        if (value) root.style.setProperty(name, value)
        else root.style.removeProperty(name)
      }
      if (previousTheme) root.setAttribute('data-theme', previousTheme)
      else root.removeAttribute('data-theme')
    }
  }, [appearance])

  return children
}
