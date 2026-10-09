import { useEffect, useRef, useState } from 'react'
import Toast from '$components/feedback/Toast'
import { useFeedbackStore } from '$stores/feedback'
import type { DemoToast } from '$types/demo-session'

const TOAST_DURATION_MS = 5000

function SessionToast({ id, message, type }: DemoToast) {
  const hideToast = useFeedbackStore(state => state.hideToast)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const remaining = useRef(TOAST_DURATION_MS)
  const paused = hovered || focused
  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => hideToast(id), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current -= Date.now() - startedAt
    }
  }, [hideToast, id, paused])
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <Toast message={message} type={type} onClose={() => hideToast(id)} />
    </div>
  )
}

export default function ToastWidget() {
  const toasts = useFeedbackStore(state => state.toasts)
  // Both regions stay mounted while empty so screen readers are already tracking them when a toast
  // is inserted; errors get their own assertive region instead of an alert nested in the polite one.
  // `empty:absolute` drops an empty region out of the flex gap without hiding it from assistive tech.
  const region = (assertive: boolean) => (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      className="flex flex-col gap-3 empty:absolute"
    >
      {toasts
        .filter(toast => (toast.type === 'error') === assertive)
        .map(toast => (
          <SessionToast key={toast.id} {...toast} />
        ))}
    </div>
  )
  return (
    <section aria-label="Notifications" className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {region(true)}
      {region(false)}
    </section>
  )
}
