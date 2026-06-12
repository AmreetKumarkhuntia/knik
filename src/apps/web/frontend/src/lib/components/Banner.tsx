import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface BannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  dismissible?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

export default function Banner({
  variant = 'info',
  dismissible = false,
  icon,
  children,
  className = '',
  onDismiss,
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const baseClasses = 'flex items-center gap-3 p-3 rounded-md border text-sm font-medium w-full'

  const variantClasses = {
    info: 'bg-info/10 text-info border-info/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-error/10 text-error border-error/20',
    success: 'bg-success/10 text-success border-success/20',
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0, marginTop: 0, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          role="alert"
        >
          {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
          <div className="flex-1">{children}</div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
