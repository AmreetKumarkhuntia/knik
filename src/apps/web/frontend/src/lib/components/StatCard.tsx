import { motion } from 'framer-motion'

interface StatCardProps {
  icon: string
  label: string
  value: number | string
  subtext?: string
  color?: string
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  color = 'primary',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 20px -6px var(--color-primary)' }}
      className="p-6 rounded-xl border border-borderLight bg-surfaceGlass backdrop-blur-xl shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `var(--color-${color})/20`, color: 'var(--color-text)' }}
        >
          <span className="text-xl">{icon}</span>
        </div>

        <div className="flex-1">
          <p className="text-textSecondary text-xs font-bold uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {subtext && <span className="text-sm text-textSecondary">{subtext}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
