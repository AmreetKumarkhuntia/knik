import Sidebar from './Sidebar'
import BackgroundEffects from '$sections/effects/BackgroundEffects'
import Toast from '$sections/feedback/Toast'
import { useStore } from '$store/index'
import type { MainLayoutProps } from '$types/sections/layout'

/** Root layout with sidebar, background effects, and toast notifications. */
export default function MainLayout({ children, onNewChat, onSelectConversation }: MainLayoutProps) {
  const toasts = useStore(s => s.toasts)
  const hideToast = useStore(s => s.hideToast)
  const handleClearHistory = useStore(s => s.handleClearHistory)

  return (
    <>
      <div className="h-screen bg-background text-foreground relative flex flex-col">
        <BackgroundEffects />

        <div className="flex flex-1 min-h-0">
          <Sidebar
            onNewChat={onNewChat}
            onClearHistory={() => void handleClearHistory()}
            onSelectConversation={onSelectConversation}
          />

          <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
        </div>
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
