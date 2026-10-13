import { registerOverlay } from './overlayStack'
import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../buttons/Button'
import MS from '../display/MS'
import type { ModalProps } from '$types/components'
import { MODAL_SIZE_CLASSES } from '$lib/constants'
import { MOTION_DURATION, MOTION_EASE_OUT, MOTION_EASE_SPRING } from '$lib/constants/motion'

const BACKDROP_ENTER = { duration: MOTION_DURATION.base, ease: MOTION_EASE_OUT }
const PANEL_ENTER = { duration: MOTION_DURATION.slow, ease: MOTION_EASE_SPRING }
const EXIT = { duration: MOTION_DURATION.fast, ease: 'easeIn' } as const
const PANEL_HIDDEN = {
  center: { opacity: 0, scale: 0.96, y: 16 },
  left: { opacity: 0, x: -32 },
  right: { opacity: 0, x: 32 },
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  titleHidden = false,
  className = '',
  size = 'md',
  placement = 'center',
}: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
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
    const focusable = (root = panel.current): HTMLElement[] =>
      [...(root?.querySelectorAll<HTMLElement>(selector) ?? [])].filter(
        el => !el.hidden && el.getAttribute('aria-hidden') !== 'true'
      )
    // Centred dialogs open on their first field rather than the header close button; drawers open
    // on the close button so a long panel is announced from its top.
    const initialFocus: HTMLElement | undefined =
      (placement === 'center' ? focusable(body.current).at(0) : undefined) ?? focusable().at(0)
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
  }, [isOpen, placement])
  const hidden = PANEL_HIDDEN[placement]
  const header = Boolean(title) && !titleHidden
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: BACKDROP_ENTER }}
          // The fading backdrop must not swallow clicks meant for the page underneath.
          exit={{ opacity: 0, pointerEvents: 'none', transition: EXIT }}
          className={`fixed inset-0 z-[120] flex bg-[rgba(10,8,6,0.5)] backdrop-blur-[8px] ${placement === 'center' ? 'items-center justify-center' : placement === 'left' ? 'justify-start' : 'justify-end'}`}
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={panel}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: PANEL_ENTER }}
            exit={{ ...hidden, transition: EXIT }}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? labelId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            className={`relative flex flex-col min-h-0 bg-surface border-border-2 shadow-knik-3 outline-none ${placement === 'center' ? `w-full ${MODAL_SIZE_CLASSES[size]} mx-4 max-h-[90dvh] rounded-2xl border` : `h-dvh w-[min(380px,100%)] ${placement === 'left' ? 'border-r' : 'border-l'}`} ${className}`}
          >
            {header && (
              <div className="flex items-center justify-between gap-3 shrink-0 pl-5 pr-3.5 pt-3.5 pb-2">
                <h2 id={labelId} className="text-h3 text-fg-1 min-w-0">
                  {title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="knik-btn--icon rounded-[9px]"
                  aria-label={`Close ${title}`}
                  onClick={onClose}
                >
                  <MS name="close" size={18} />
                </Button>
              </div>
            )}
            {title && titleHidden && (
              <h2 id={labelId} className="sr-only">
                {title}
              </h2>
            )}
            <div
              ref={body}
              className={`min-h-0 overflow-y-auto flex-1 ${header ? 'px-5 pb-5 pt-1.5' : titleHidden ? 'p-2.5' : 'p-5'}`}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
