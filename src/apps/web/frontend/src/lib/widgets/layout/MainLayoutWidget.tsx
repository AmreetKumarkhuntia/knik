import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SidebarWidget from './SidebarWidget'
import TopBar from '$components/layout/TopBar'
import ToastWidget from '$widgets/feedback/ToastWidget'
import { CommandPalette } from '$components'
import { useKeyboardShortcuts, useViewport } from '$hooks'
import { useChatStore } from '$stores/chat'
import { useSettingsStore } from '$stores/settings'
import { useShellStore, useShellScope } from '$stores/shell'
import { useShellView } from '$stores/views'
import { COMMAND_GROUPS, KEYBOARD_SHORTCUTS, ROUTES } from '$lib/constants/navigation'
import type { MainLayoutWidgetProps } from '$types/widgets/chat-shell'

export default function MainLayoutWidget({ children }: MainLayoutWidgetProps) {
  const mode = useSettingsStore(state => state.appearance.mode)
  const updateAppearance = useSettingsStore(state => state.updateAppearance)
  const startConversation = useChatStore(state => state.startConversation)
  const location = useLocation()
  const navigate = useNavigate()
  const { scopeId, scope, patch } = useShellScope()
  const { paletteOpen, paletteQuery, mobileNavigationOpen } = scope
  const viewport = useViewport()
  const setPaletteQuery = (paletteQuery: string) => patch({ paletteQuery })
  const openPalette = () =>
    patch({ paletteOpen: true, paletteQuery: '', mobileNavigationOpen: false })
  const closePalette = () => patch({ paletteOpen: false, paletteQuery: '' })
  const togglePalette = useShellStore(state => state.togglePalette)
  const { commands: filteredCommands, crumbs } = useShellView(location.pathname, scopeId)

  useEffect(() => {
    if (viewport !== 'mobile') patch({ mobileNavigationOpen: false })
  }, [viewport, patch])

  useEffect(() => {
    patch({ mobileNavigationOpen: false })
  }, [location.pathname, patch])

  // The ⌘J shortcut can fire while the palette or mobile drawer is open.
  const newChat = () => {
    patch({ paletteOpen: false, paletteQuery: '', mobileNavigationOpen: false })
    startConversation()
    void navigate(ROUTES.home)
  }

  useKeyboardShortcuts([
    ...KEYBOARD_SHORTCUTS.commandPalette.map(chord => ({
      ...chord,
      handler: () => togglePalette(scopeId),
    })),
    ...KEYBOARD_SHORTCUTS.newChat.map(chord => ({ ...chord, handler: newChat })),
  ])

  const runCommand = (id: string) => {
    closePalette()
    if (id === 'new-chat') return newChat()
    const path = COMMAND_GROUPS.flatMap(group => group.items).find(item => item.id === id)?.path
    if (path) void navigate(path)
  }

  return (
    <>
      <div className="h-dvh bg-background text-foreground flex flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 relative">
          <SidebarWidget
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
