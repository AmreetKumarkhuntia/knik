import { motion } from 'framer-motion'
import { BANNER_ROLE } from '$lib/constants'
import type { BannerProps } from '$types'

export default function Banner({ variant = 'info', icon, children, className = '' }: BannerProps) {
  const color = `var(--${variant})`

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-3 p-3 rounded-md border text-body font-medium w-full ${className}`}
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
        background: `color-mix(in srgb, ${color} 6%, transparent)`,
      }}
      role={BANNER_ROLE[variant]}
    >
      {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <div className="flex-1">{children}</div>
    </motion.div>
  )
}
