import MS from './MS'
import type { EmptyStateProps } from '$types/components'

/** Placeholder component shown when no data is available. */
export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="px-5 py-10 text-center">
      {typeof icon === 'string' ? (
        <MS name={icon} size={28} className="block text-fg-4" />
      ) : (
        <div className="flex justify-center text-fg-4">{icon}</div>
      )}
      <p className="mt-2 text-h4 text-fg-1">{title}</p>
      {description && <p className="mt-1 text-body-sm text-fg-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
