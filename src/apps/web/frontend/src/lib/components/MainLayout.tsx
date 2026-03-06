import type { ReactNode } from 'react'
import { Sidebar, BackgroundEffects, HamburgerButton, Toast } from '.'
import type { ToastType } from '$types/components'

interface MainLayoutProps {
  children: ReactNode
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toasts: Array<{ id: number; message: string; type: ToastType }>
  hideToast: (id: number) => void
  onNewChat: () => void
  onClearHistory: () => void
}

export default function MainLayout({
  children,
  sidebarOpen,
  setSidebarOpen,
  toasts,
  hideToast,
  onNewChat,
  onClearHistory,
}: MainLayoutProps) {
  return (
    <>
      <div className="h-screen bg-gray-950 relative overflow-hidden flex flex-col">
        <BackgroundEffects />

        {!sidebarOpen && <HamburgerButton onClick={() => setSidebarOpen(true)} />}

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={onNewChat}
          onClearHistory={onClearHistory}
        />

        {children}
      </div>

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
