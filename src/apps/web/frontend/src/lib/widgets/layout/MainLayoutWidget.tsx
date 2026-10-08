import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SidebarWidget from './SidebarWidget'
import TopBar from '$components/layout/TopBar'
import BackgroundEffects from '$components/display/BackgroundEffects'
import ToastWidget from '$widgets/feedback/ToastWidget'
import { CommandPalette, MS } from '$components'
import Button from '$components/buttons/Button'
import { useDemoSession } from '$widgets/session/useDemoSession'
import { COMMAND_GROUPS, ROUTES } from '$lib/constants/navigation'
import type { MainLayoutWidgetProps } from '$types/widgets/chat-shell'

function crumbsFor(pathname: string): string[] {
  if (pathname === ROUTES.settings) return ['Settings']
  if (pathname === ROUTES.schedules) return ['Workflows', 'Schedules']
  if (pathname === ROUTES.executions) return ['Workflows', 'Executions']
  if (pathname.startsWith('/executions/')) return ['Executions', 'Detail']
  if (pathname.startsWith('/workflows/') && pathname.endsWith('/edit'))
    return ['Workflows', 'Builder']
  if (pathname === ROUTES.builder) return ['Workflows', 'Builder']
  if (pathname === ROUTES.workflows) return ['Workflows', 'Hub']
  return ['Knik AI', 'Chat']
}

export default function MainLayoutWidget({ children }: MainLayoutWidgetProps) {
  const mode = useDemoSession(state => state.appearance.mode)
  const updateAppearance = useDemoSession(state => state.updateAppearance)
  const startConversation = useDemoSession(state => state.startConversation)
  const location = useLocation()
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const filteredCommands = COMMAND_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(paletteQuery.trim().toLowerCase())
    ),
  })).filter(group => group.items.length > 0)
  const openPalette = () => {
    setPaletteQuery('')
    setPaletteOpen(true)
  }
  const closePalette = () => {
    setPaletteQuery('')
    setPaletteOpen(false)
  }
  const crumbs = useMemo(() => crumbsFor(location.pathname), [location.pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteQuery('')
        setPaletteOpen(value => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  const rightActions =
    location.pathname === ROUTES.workflows ? (
      <Button
        variant="primary"
        size="sm"
        icon={<MS name="add" size={16} />}
        label="Create workflow"
        onClick={() => void navigate(ROUTES.builder)}
      />
    ) : null

  return (
    <>
      <div className="h-screen bg-background text-foreground relative flex flex-col overflow-hidden">
        <BackgroundEffects />
        <div className="flex flex-1 min-h-0 relative">
          <SidebarWidget onOpenSearch={openPalette} />
          <main className="flex-1 min-w-0 flex flex-col">
            <TopBar
              crumbs={crumbs}
              right={rightActions}
              onOpenSearch={openPalette}
              dark={mode === 'dark'}
              onToggleTheme={() => updateAppearance({ mode: mode === 'dark' ? 'light' : 'dark' })}
            />
            <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
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
