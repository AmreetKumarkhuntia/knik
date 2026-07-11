import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BackgroundEffects from '$sections/effects/BackgroundEffects'
import Toast from '$sections/feedback/Toast'
import { CommandPalette, ActionButton, MS } from '$components'
import { useStore } from '$store/index'
import { useTheme } from '$hooks/useTheme'
import { COMMAND_GROUPS, ROUTES } from '$lib/constants'
import type { MainLayoutProps } from '$types/sections/layout'

/** Derive breadcrumb trail from the current route. */
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

/** Root layout: glass sidebar + command-bar top bar + routed content + palette. */
export default function MainLayout({ children, onNewChat, onSelectConversation }: MainLayoutProps) {
  const toasts = useStore(s => s.toasts)
  const hideToast = useStore(s => s.hideToast)
  const { mode, setMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const dark = mode !== 'light'
  const crumbs = useMemo(() => crumbsFor(location.pathname), [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const runCommand = (id: string) => {
    switch (id) {
      case 'new-chat':
        onNewChat()
        if (location.pathname !== '/') void navigate('/')
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
      default:
        break
    }
  }

  const rightActions =
    location.pathname === ROUTES.workflows ? (
      <ActionButton
        variant="primary"
        size="sm"
        icon={<MS name="add" size={16} />}
        label="Create workflow"
        onClick={() => void navigate(ROUTES.builder)}
      />
    ) : null

  return (
    <>
      <div className="h-screen bg-background text-foreground relative flex flex-col">
        <BackgroundEffects />

        <div className="flex flex-1 min-h-0">
          <Sidebar
            onNewChat={onNewChat}
            onSelectConversation={onSelectConversation}
            onOpenSearch={() => setPaletteOpen(true)}
          />

          <main className="flex-1 min-w-0 flex flex-col">
            <TopBar
              crumbs={crumbs}
              right={rightActions}
              onOpenSearch={() => setPaletteOpen(true)}
              dark={dark}
              onToggleTheme={() => setMode(dark ? 'light' : 'dark')}
            />
            <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
          </main>
        </div>
      </div>

      <CommandPalette
        commands={COMMAND_GROUPS}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={runCommand}
      />

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </>
  )
}
