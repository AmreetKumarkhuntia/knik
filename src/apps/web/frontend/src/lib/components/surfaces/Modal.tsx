import { registerOverlay } from './overlayStack'
import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import type { ModalProps } from '$types/components'
import { MODAL_SIZE_CLASSES } from '$lib/constants'

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  size = 'md',
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
  if (!isOpen) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        className={`relative knik-glass rounded-xl shadow-knik-3 ${MODAL_SIZE_CLASSES[size]} w-full mx-4 max-h-[90vh] overflow-auto ${className}`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-border-2">
            <h2 id={labelId} className="text-xl font-bold text-fg-1">
              {title}
            </h2>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
