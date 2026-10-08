import { useEffect } from 'react'
import Toast from '$components/feedback/Toast'
import { useFeedbackStore } from '$stores/feedback'
import type { SessionToastProps } from '$types/widgets/chat-shell'

function SessionToast({ id, message, type }: SessionToastProps) {
  const hideToast = useFeedbackStore(state => state.hideToast)
  useEffect(() => {
    const timer = window.setTimeout(() => hideToast(id), 5000)
    return () => window.clearTimeout(timer)
  }, [hideToast, id])
  return <Toast message={message} type={type} onClose={() => hideToast(id)} />
}

export default function ToastWidget() {
  const toasts = useFeedbackStore(state => state.toasts)
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <SessionToast key={toast.id} {...toast} />
      ))}
    </div>
  )
}
