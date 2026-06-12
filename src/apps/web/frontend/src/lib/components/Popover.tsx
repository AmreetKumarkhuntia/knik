import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface PopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export default function Popover({
  trigger,
  content,
  placement = 'bottom-start',
  open: controlledOpen,
  onOpenChange,
  className = '',
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const containerRef = useRef<HTMLDivElement>(null)

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  const toggle = useCallback(() => {
    handleOpenChange(!isOpen)
  }, [isOpen, handleOpenChange])

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleOpenChange(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleOpenChange(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleOpenChange])

  // Determine placement classes
  let placementClasses = ''
  let originClass = ''
  switch (placement) {
    case 'bottom-start':
      placementClasses = 'top-[calc(100%+8px)] left-0'
      originClass = 'origin-top-left'
      break
    case 'bottom-end':
      placementClasses = 'top-[calc(100%+8px)] right-0'
      originClass = 'origin-top-right'
      break
    case 'top-start':
      placementClasses = 'bottom-[calc(100%+8px)] left-0'
      originClass = 'origin-bottom-left'
      break
    case 'top-end':
      placementClasses = 'bottom-[calc(100%+8px)] right-0'
      originClass = 'origin-bottom-right'
      break
  }

  return (
    <div className={`relative inline-flex ${className}`} ref={containerRef}>
      <div
        onClick={toggle}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          }
        }}
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: placement.startsWith('top') ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: placement.startsWith('top') ? 5 : -5 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 flex flex-col gap-0.5 p-2 min-w-[200px] knik-glass rounded-[10px] shadow-3 ${placementClasses} ${originClass}`}
            role="dialog"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
