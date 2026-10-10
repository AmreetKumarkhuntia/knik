import { registerOverlay } from './overlayStack'
import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../buttons/Button'
import MS from '../display/MS'
import type { ModalProps } from '$types/components'
import { MODAL_SIZE_CLASSES } from '$lib/constants'

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const ENTER = { duration: 0.18, ease: EASE_OUT }
const EXIT = { duration: 0.12, ease: 'easeIn' } as const
// Drawers slide in from their edge; centred dialogs settle from a slight scale.
const PANEL_HIDDEN = {
  center: { opacity: 0, scale: 0.98, y: 4 },
  left: { x: '-100%' },
  right: { x: '100%' },
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  size = 'md',
  placement = 'center',
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  const labelId = useId()
  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    const overlay = registerOverlay(true)
    const selector =
      'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
    const focusable = (): HTMLElement[] =>
      [...(panel.current?.querySelectorAll<HTMLElement>(selector) ?? [])].filter(
        el => !el.hidden && el.getAttribute('aria-hidden') !== 'true'
      )
    const initialFocus: HTMLElement | undefined = focusable().at(0)
    if (initialFocus) initialFocus.focus()
    else panel.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (!overlay.isTop()) return
      if (event.key === 'Escape') {
        event.stopImmediatePropagation()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable(),
        first = items.at(0),
        last = items.at(-1)
      if (!first) {
        event.preventDefault()
        panel.current?.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel.current)
      ) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      const wasTop = overlay.isTop()
      overlay.release()
      document.removeEventListener('keydown', keydown)
      if (wasTop && previous?.isConnected) previous.focus()
    }
  }, [isOpen])
  const hidden = PANEL_HIDDEN[placement]
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: ENTER }}
          // The fading backdrop must not swallow clicks meant for the page underneath.
          exit={{ opacity: 0, pointerEvents: 'none', transition: EXIT }}
          className={`fixed inset-0 z-[120] flex bg-black/50 ${placement === 'center' ? 'items-center justify-center' : placement === 'left' ? 'justify-start' : 'justify-end'}`}
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={panel}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: ENTER }}
            exit={{ ...hidden, transition: EXIT }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? labelId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            className={`relative border border-[var(--border-2)] bg-surface shadow-knik-3 w-full flex flex-col min-h-0 ${placement === 'center' ? `rounded-xl ${MODAL_SIZE_CLASSES[size]} mx-4 max-h-[90dvh]` : `h-dvh max-w-full sm:max-w-[360px] ${placement === 'left' ? 'border-l-0' : 'border-r-0'}`} ${className}`}
          >
            {title && (
              <div className="px-4 py-3 border-b border-[var(--border-2)] flex items-center justify-between gap-3 shrink-0">
                <h2 id={labelId} className="text-h3 text-fg-1">
                  {title}
                </h2>
                {placement !== 'center' && (
                  <Button variant="ghost" size="sm" aria-label={`Close ${title}`} onClick={onClose}>
                    <MS name="close" size={18} />
                  </Button>
                )}
              </div>
            )}
            <div className="p-4 min-h-0 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
