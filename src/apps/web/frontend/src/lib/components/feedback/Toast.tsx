import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import type { ToastProps } from '$types/components'

export default function Toast({ message, type, onClose }: ToastProps) {
  const colors = { success: 'text-success', error: 'text-error', info: 'text-info' }
  const icons = { success: 'check_circle', error: 'cancel', info: 'info' }
  // No live role of its own: ToastWidget's persistent regions announce it, because a live node
  // inserted already populated is often skipped and one nested in another region is read twice.
  return (
    <div className="border border-[var(--border-2)] bg-surface text-fg-1 px-4 py-3 rounded-lg shadow-knik-2 flex items-center gap-3 max-w-sm">
      <MS name={icons[type]} size={24} fill={1} className={colors[type]} />
      <p className="flex-1">{message}</p>
      <Button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-fg-3 hover:text-fg-1 transition-colors"
        variant="ghost"
      >
        <MS name="close" size={20} />
      </Button>
    </div>
  )
}
