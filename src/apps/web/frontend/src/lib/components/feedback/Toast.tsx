import { CheckCircle, Cancel, Info, Close } from '@mui/icons-material'
import Button from '$components/buttons/Button'
import type { ToastProps } from '$types/components'

export default function Toast({ message, type, onClose }: ToastProps) {
  const colors = { success: 'bg-success', error: 'bg-error', info: 'bg-info' }
  const icons = { success: <CheckCircle />, error: <Cancel />, info: <Info /> }
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`${colors[type]} text-inverse px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm`}
    >
      <span className="text-2xl" aria-hidden="true">
        {icons[type]}
      </span>
      <p className="flex-1">{message}</p>
      <Button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-inverse/80 hover:text-inverse transition-colors"
        variant="ghost"
      >
        <Close />
      </Button>
    </div>
  )
}
