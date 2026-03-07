import Sidebar from './Sidebar'
import BackgroundEffects from '$sections/effects/BackgroundEffects'
import HamburgerButton from '$components/HamburgerButton'
import Toast from '$sections/feedback/Toast'
import type { MainLayoutProps } from '$types/sections/layout'

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
