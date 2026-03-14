import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Backdrop from '$components/Backdrop'
import type { ModalProps, ModalSize } from '$types/components'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  size = 'md',
  animationEnabled = true,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const modalContent = (
    <div className="fixed inset-0 z-120 flex items-center justify-center pointer-events-none modal-container">
      <Backdrop visible={true} onClick={onClose} blur="md" />
      <motion.div
        initial={animationEnabled ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        animate={animationEnabled ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
        exit={animationEnabled ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={animationEnabled ? { type: 'spring', stiffness: 300, damping: 30 } : {}}
        className={`relative bg-surfaceGlass backdrop-blur-xl rounded-2xl border border-borderLight shadow-2xl ${sizeClasses[size]} w-full mx-4 pointer-events-auto ${className}`}
        style={{
          boxShadow: '0 25px 50px -12px var(--color-shadow)',
          zIndex: 130,
        }}
      >
        {title && (
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  )

  return <AnimatePresence>{isOpen && modalContent}</AnimatePresence>
}
