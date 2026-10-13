import { useEffect } from 'react'
import { useSettingsStore } from '$stores/settings'
import type { MainLayoutWidgetProps } from '$types/widgets/chat-shell'

export default function ThemeWidget({ children }: MainLayoutWidgetProps) {
  const mode = useSettingsStore(state => state.appearance.mode)

  useEffect(() => {
    const root = document.documentElement
    const previousTheme = root.getAttribute('data-theme')
    root.setAttribute('data-theme', mode)
    return () => {
      if (previousTheme !== null) root.setAttribute('data-theme', previousTheme)
      else root.removeAttribute('data-theme')
    }
  }, [mode])

  return children
}
