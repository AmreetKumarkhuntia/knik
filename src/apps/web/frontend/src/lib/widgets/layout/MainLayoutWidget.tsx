import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SidebarWidget from './SidebarWidget'
import TopBar from '$components/layout/TopBar'
import ToastWidget from '$widgets/feedback/ToastWidget'
import { CommandPalette } from '$components'
import { useChatStore } from '$stores/chat'
import { useSettingsStore } from '$stores/settings'
import { useShellStore, useShellScope } from '$stores/shell'
import { useShellView } from '$stores/views'
import { ROUTES } from '$lib/constants/navigation'
import type { MainLayoutWidgetProps } from '$types/widgets/chat-shell'

export default function MainLayoutWidget({ children }: MainLayoutWidgetProps) {
  const mode = useSettingsStore(state => state.appearance.mode)
  const updateAppearance = useSettingsStore(state => state.updateAppearance)
  const startConversation = useChatStore(state => state.startConversation)
  const location = useLocation()
  const navigate = useNavigate()
  const { scopeId, scope, patch } = useShellScope()
  const { paletteOpen, paletteQuery, viewport, mobileNavigationOpen } = scope
  const setPaletteQuery = (paletteQuery: string) => patch({ paletteQuery })
  const openPalette = () =>
    patch({ paletteOpen: true, paletteQuery: '', mobileNavigationOpen: false })
  const closePalette = () => patch({ paletteOpen: false, paletteQuery: '' })
  const togglePalette = useShellStore(state => state.togglePalette)
  const { commands: filteredCommands, crumbs } = useShellView(location.pathname, scopeId)

  useEffect(() => {
    const resize = () => {
      const viewport =
        window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
      patch({ viewport, ...(viewport !== 'mobile' ? { mobileNavigationOpen: false } : {}) })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [patch])

  useEffect(() => {
    patch({ mobileNavigationOpen: false })
  }, [location.pathname, patch])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        togglePalette(scopeId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePalette, scopeId])

  const runCommand = (id: string) => {
    closePalette()
    switch (id) {
      case 'new-chat':
        startConversation()
        void navigate(ROUTES.home)
        break
      case 'nav-home':
        void navigate(ROUTES.home)
        break
      case 'nav-workflows':
        void navigate(ROUTES.workflows)
        break
      case 'nav-builder':
        void navigate(ROUTES.builder)
        break
      case 'nav-schedules':
        void navigate(ROUTES.schedules)
        break
      case 'nav-settings':
      case 'nav-keys':
        void navigate(ROUTES.settings)
        break
    }
  }

  return (
    <>
      <div className="h-dvh bg-background text-foreground flex flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 relative">
          <SidebarWidget
            onOpenSearch={openPalette}
            viewport={viewport}
            mobileOpen={mobileNavigationOpen}
            onCloseMobile={() => patch({ mobileNavigationOpen: false })}
          />
          <main className="flex-1 min-w-0 flex flex-col">
            <TopBar
              crumbs={crumbs}
              onOpenNavigation={
                viewport === 'mobile' ? () => patch({ mobileNavigationOpen: true }) : undefined
              }
              onOpenSearch={openPalette}
              dark={mode === 'dark'}
              onToggleTheme={() => updateAppearance({ mode: mode === 'dark' ? 'light' : 'dark' })}
            />
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>
          </main>
        </div>
      </div>
      <CommandPalette
        commands={filteredCommands}
        query={paletteQuery}
        onQueryChange={setPaletteQuery}
        open={paletteOpen}
        onClose={closePalette}
        onSelect={runCommand}
      />
      <ToastWidget />
    </>
  )
}
