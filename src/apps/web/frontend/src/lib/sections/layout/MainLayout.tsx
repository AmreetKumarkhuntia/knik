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
}: MainLayoutProps) {
  return (
    <>
      <div className="h-screen bg-background relative overflow-hidden flex flex-col">
        <BackgroundEffects />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar onNewChat={onNewChat} onClearHistory={onClearHistory} />

          <div className="flex-1 overflow-hidden">{children}</div>
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
