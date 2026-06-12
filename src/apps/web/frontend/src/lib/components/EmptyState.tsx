import type { EmptyStateProps } from '$types/components'
import { EMPTY_STATE_DEFAULTS } from '$lib/constants'

/** Placeholder component shown when no data is available. */
export default function EmptyState({
  icon = EMPTY_STATE_DEFAULTS.icon,
  title,
  description,
  action,
  className = EMPTY_STATE_DEFAULTS.className,
}: EmptyStateProps) {
  const isReactNode = typeof icon !== 'string'

  return (
    <div className={`text-center py-20 text-fg-4 ${className}`}>
      {isReactNode ? (
        <div className="flex justify-center mb-4 text-4xl text-fg-4">{icon}</div>
      ) : (
        <p className="text-4xl mb-4">{icon}</p>
      )}
      <p className="text-fg-2 font-medium">{title}</p>
      {description && <p className="text-sm mt-2 text-fg-4">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
