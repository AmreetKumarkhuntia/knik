import { registerOverlay } from './overlayStack'
import { useState, useRef, useEffect, useCallback, useId } from 'react'
import type { PopoverProps } from '$types/components/surfaces'

export default function Popover({
  renderTrigger,
  content,
  placement = 'bottom-start',
  open: controlledOpen,
  onOpenChange,
  className = '',
  role = 'dialog',
  label,
  autoFocus = true,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const container = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const change = useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(value)
      onOpenChange?.(value)
    },
    [controlledOpen, onOpenChange]
  )
  const changeRef = useRef(change)
  useEffect(() => {
    changeRef.current = change
  }, [change])
  useEffect(() => {
    if (!open) return
    const overlay = registerOverlay()
    const triggerElement = trigger.current
    if (autoFocus)
      panel.current
        ?.querySelector<HTMLElement>('button:not(:disabled),[tabindex="0"],input:not(:disabled)')
        ?.focus()
    const outside = (event: PointerEvent) => {
      if (overlay.isTop() && !container.current?.contains(event.target as Node))
        changeRef.current(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && overlay.isTop()) {
        event.stopImmediatePropagation()
        changeRef.current(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      const wasTop = overlay.isTop()
      overlay.release()
      if (wasTop && triggerElement?.isConnected && document.activeElement === document.body)
        triggerElement.focus()
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, autoFocus])
  return (
    <div ref={container} className={`relative inline-flex ${className}`}>
      {renderTrigger({
        ref: trigger,
        onClick: () => change(!open),
        'aria-haspopup': role,
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
      })}
      {open && (
        <div
          id={id}
          ref={panel}
          role={role}
          aria-label={label}
          className={`absolute z-50 flex flex-col gap-0.5 p-2 min-w-[200px] max-w-[calc(100vw-32px)] max-h-[min(420px,70dvh)] overflow-auto border border-[var(--border-2)] bg-surface rounded-[10px] shadow-knik-2 ${placement.startsWith('top') ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} ${placement.endsWith('end') ? 'right-0' : 'left-0'}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
