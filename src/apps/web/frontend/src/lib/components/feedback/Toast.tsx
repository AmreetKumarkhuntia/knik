import Button from '$components/buttons/Button'
import MS from '$components/display/MS'
import type { ToastProps } from '$types/components'

export default function Toast({ message, type, onClose }: ToastProps) {
  const colors = {
    success: 'text-[var(--success)]',
    error: 'text-[var(--danger)]',
    info: 'text-[var(--acc-text)]',
  }
  const icons = { success: 'check_circle', error: 'error', info: 'info' }
  // No live role of its own: ToastWidget's persistent regions announce it, because a live node
  // inserted already populated is often skipped and one nested in another region is read twice.
  return (
    <div className="flex items-center gap-2.5 max-w-[min(420px,calc(100vw-32px))] py-1.5 pl-3 pr-1.5 rounded-[14px] border border-border-2 bg-surface shadow-knik-3 text-label text-fg-1">
      <MS name={icons[type]} size={18} className={colors[type]} />
      <p className="flex-1 min-w-0 py-1">{message}</p>
      <Button
        variant="ghost"
        size="sm"
        className="knik-btn--icon rounded-[9px]"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <MS name="close" size={16} />
      </Button>
    </div>
  )
}
