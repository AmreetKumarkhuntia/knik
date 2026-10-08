import { CheckCircle, Cancel, Info, Close } from '@mui/icons-material'
import Button from '$components/buttons/Button'
import type { ToastProps } from '$types/components'

export default function Toast({ message, type, onClose }: ToastProps) {
  const colors = { success: 'text-success', error: 'text-error', info: 'text-info' }
  const icons = { success: <CheckCircle />, error: <Cancel />, info: <Info /> }
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className="border border-[var(--border-2)] bg-surface text-fg-1 px-4 py-3 rounded-lg shadow-knik-2 flex items-center gap-3 max-w-sm"
    >
      <span className={`text-xl ${colors[type]}`} aria-hidden="true">
        {icons[type]}
      </span>
      <p className="flex-1">{message}</p>
      <Button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-fg-3 hover:text-fg-1 transition-colors"
        variant="ghost"
      >
        <Close />
      </Button>
    </div>
  )
}
