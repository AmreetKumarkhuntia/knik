import { motion } from 'framer-motion'

import ActionButton from './ActionButton'

import type { EnhancedEmptyStateProps } from '$types/components'

export default function EnhancedEmptyState({
  title = 'No workflows yet',
  description = 'Create your first workflow to automate your processes and powerful AI agents.',
  actionLabel = 'Create Workflow',
  onAction,
  secondaryActionLabel = 'Learn More',
  onSecondaryAction,
}: EnhancedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center py-16 px-6"
    >
      <motion.div
        initial={{ scale: 0.8, rotate: 0 }}
        animate={{
          scale: 1,
          rotate: 360,
          transition: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2 },
        }}
        className="w-32 h-32 mx-auto mb-4 relative flex items-center justify-center"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 217, 244, 0.4) 0%, rgba(0, 217, 244, 0.1) 100%)',
            boxShadow: '0 0 20px rgba(0, 217, 244, 0.4)',
            filter: 'blur(8px)',
            opacity: 0.4,
          }}
        />
        <div className="relative z-10 text-6xl" style={{ color: 'var(--color-accent)' }}>
          ⚡
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full max-w-md bg-surfaceGlass backdrop-blur-xl border border-borderLight rounded-2xl p-8 relative mx-auto"
      >
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>

        <p className="text-textSecondary text-sm mt-6">{description}</p>

        <div className="flex gap-3 mt-6">
          <ActionButton icon="⚡" label={actionLabel} variant="primary" onClick={onAction} />
          {onSecondaryAction && (
            <ActionButton
              icon="📚"
              label={secondaryActionLabel}
              variant="secondary"
              onClick={onSecondaryAction}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
