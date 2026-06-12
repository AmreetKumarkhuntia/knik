import React from 'react'
import { motion } from 'framer-motion'

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'default' | 'running'
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  animated = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div
      className={`w-full bg-surface-3 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <motion.div
        className={`h-full rounded-full shadow-glow ${variant === 'running' ? 'bg-[length:24px_100%] animate-[stripe_1s_linear_infinite]' : ''}`}
        style={{
          width: `${percentage}%`,
          ...(variant === 'default'
            ? {
                background: 'linear-gradient(90deg, var(--aurora-400), var(--teal-400))',
              }
            : {
                backgroundImage:
                  'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0 6px, transparent 6px 12px), linear-gradient(90deg, var(--aurora-400), var(--teal-400))',
              }),
        }}
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${percentage}%` }}
        transition={{ ease: 'easeOut', duration: 0.5 }}
      />
    </div>
  )
}
