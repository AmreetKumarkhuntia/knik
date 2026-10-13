import { motion } from 'framer-motion'
import { BANNER_ICON, BANNER_ROLE, MOTION_DURATION, MOTION_EASE_OUT } from '$lib/constants'
import MS from '../display/MS'
import type { BannerProps } from '$types'

export default function Banner({ variant = 'info', icon, children, className = '' }: BannerProps) {
  const color = `var(--${variant})`

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE_OUT }}
      className={`flex items-center gap-2.5 w-full rounded-[12px] border px-3.5 py-2.5 text-body text-fg-1 ${className}`}
      style={{
        borderColor: `color-mix(in srgb, ${color} 42%, transparent)`,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
      role={BANNER_ROLE[variant]}
    >
      <span className="flex shrink-0 items-center justify-center" style={{ color }}>
        {icon ?? <MS name={BANNER_ICON[variant]} size={18} />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  )
}
