import { motion } from 'framer-motion'
import type { MetricCardProps } from '$types/components'

/** Animated card displaying a key metric with icon and trend indicator. */
export default function MetricCard({
  icon,
  label,
  value,
  subtext,
  trend,
  color = 'primary',
  loading = false,
}: MetricCardProps) {
  const colorMap = {
    primary: {
      bg: 'bg-[var(--primary-soft-2)]',
      text: 'text-[var(--primary)]',
    },
    teal: {
      bg: 'bg-[var(--success-bg)]',
      text: 'text-[var(--success)]',
    },
    rose: {
      bg: 'bg-[var(--danger-bg)]',
      text: 'text-[var(--danger)]',
    },
    blue: {
      bg: 'bg-[var(--info-bg)]',
      text: 'text-[var(--info)]',
    },
  }

  const colors = colorMap[color]

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6 knik-card--glass animate-pulse">
        <div className="flex justify-between items-start">
          <div className="p-2 rounded-md w-12 h-12 bg-surface-2" />
          <div className="w-16 h-6 rounded-full bg-surface-3" />
        </div>
        <div>
          <div className="w-24 h-4 bg-surface-3 rounded mb-2" />
          <div className="w-16 h-8 bg-surface-2 rounded" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 20px -6px rgba(0, 217, 244, 0.4)' }}
      className="flex flex-col gap-4 p-6 knik-card--glass"
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-md ${colors.bg} ${colors.text}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {trend && (
          <span
            className={`text-xs font-bold bg-surface-3 px-2 py-1 rounded-full flex items-center gap-1 ${
              trend.direction === 'up'
                ? 'text-[var(--success)]'
                : trend.direction === 'down'
                  ? 'text-[var(--danger)]'
                  : 'text-fg-3'
            }`}
          >
            {trend.icon && <span className="material-symbols-outlined text-xs">{trend.icon}</span>}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-fg-3 text-sm font-medium">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-fg-1 text-3xl font-bold mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {subtext && <span className="text-sm text-fg-3 mb-1">{subtext}</span>}
        </div>
      </div>
    </motion.div>
  )
}
