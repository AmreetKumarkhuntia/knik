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
      bg: 'bg-primary/20',
      text: 'text-primary',
    },
    teal: {
      bg: 'bg-success/20',
      text: 'text-success',
    },
    rose: {
      bg: 'bg-error/20',
      text: 'text-error',
    },
    blue: {
      bg: 'bg-info/20',
      text: 'text-info',
    },
  }

  const colors = colorMap[color]

  if (loading) {
    return (
      <div className="flex flex-col gap-4 rounded-xl p-6 glass border border-border shadow-sm animate-pulse">
        <div className="flex justify-between items-start">
          <div className="p-2 rounded-lg w-12 h-12 bg-surfaceRaised" />
          <div className="w-16 h-6 rounded-full bg-surface" />
        </div>
        <div>
          <div className="w-24 h-4 bg-surface rounded mb-2" />
          <div className="w-16 h-8 bg-surfaceRaised rounded" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 20px -6px var(--color-primary)' }}
      className="flex flex-col gap-4 rounded-xl p-6 glass border border-border shadow-sm"
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {trend && (
          <span
            className={`text-xs font-bold bg-surface px-2 py-1 rounded-full flex items-center gap-1 ${
              trend.direction === 'up'
                ? 'text-success'
                : trend.direction === 'down'
                  ? 'text-error'
                  : 'text-secondary'
            }`}
          >
            {trend.icon && <span className="material-symbols-outlined text-xs">{trend.icon}</span>}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-secondary text-sm font-medium">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-foreground text-3xl font-bold mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {subtext && <span className="text-sm text-secondary mb-1">{subtext}</span>}
        </div>
      </div>
    </motion.div>
  )
}
