import type { EmptyStateProps } from '$types/components'

export default function EmptyState({
  icon = '📜',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-20 text-white/50 ${className}`}>
      <p className="text-4xl mb-4">{icon}</p>
      <p className="text-white/80 font-medium">{title}</p>
      {description && <p className="text-sm mt-2 text-white/60">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
