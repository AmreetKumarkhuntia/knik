import Sidebar from './Sidebar'
import BackgroundEffects from '$sections/effects/BackgroundEffects'
import Toast from '$sections/feedback/Toast'
import type { MainLayoutProps } from '$types/sections/layout'

export default function MainLayout({
  children,
  toasts,
  hideToast,
  onNewChat,
  onClearHistory,
  onSelectConversation,
}: MainLayoutProps) {
  return (
    <>
      <div className="h-screen bg-background text-foreground relative flex flex-col">
        <BackgroundEffects />

        <div className="flex flex-1 min-h-0">
          <Sidebar
            onNewChat={onNewChat}
            onClearHistory={onClearHistory}
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
