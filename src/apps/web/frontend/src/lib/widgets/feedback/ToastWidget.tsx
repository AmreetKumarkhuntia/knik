import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Toast from '$components/feedback/Toast'
import { useFeedbackStore } from '$stores/feedback'
import { MOTION_DURATION, MOTION_EASE_SPRING } from '$lib/constants/motion'
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
    <motion.div
      layout
      className="pointer-events-auto"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE_SPRING },
      }}
      exit={{ opacity: 0, transition: { duration: MOTION_DURATION.fast, ease: 'easeIn' } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <Toast message={message} type={type} onClose={() => hideToast(id)} />
    </motion.div>
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
      className="flex flex-col items-center gap-2 empty:absolute"
    >
      <AnimatePresence>
        {toasts
          .filter(toast => (toast.type === 'error') === assertive)
          .map(toast => (
            <SessionToast key={toast.id} {...toast} />
          ))}
      </AnimatePresence>
    </div>
  )
  return (
    <section
      aria-label="Notifications"
      className="fixed inset-x-0 bottom-5 z-[130] flex flex-col items-center gap-2 px-4 pointer-events-none"
    >
      {region(true)}
      {region(false)}
    </section>
  )
}
