import { motion } from 'framer-motion'
import type { ProgressBarProps } from '$types'

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
        className="h-full rounded-full"
        style={{
          width: `${percentage}%`,
          background: variant === 'running' ? 'var(--info)' : 'var(--primary)',
        }}
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${percentage}%` }}
        transition={{ ease: 'easeOut', duration: 0.5 }}
      />
    </div>
  )
}
