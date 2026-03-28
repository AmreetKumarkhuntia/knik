import { Notifications } from '@mui/icons-material'
import type { NotificationButtonProps } from '$types/components'

/** Notification bell button with badge count display. */
export default function NotificationButton({ badgeCount = 0, onClick }: NotificationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-foreground hover:bg-surface transition-colors"
      aria-label="Notifications"
    >
      <Notifications style={{ fontSize: '20px' }} />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-error text-inverse text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  )
}
