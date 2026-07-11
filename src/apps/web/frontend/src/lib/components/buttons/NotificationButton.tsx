import { Notifications } from '@mui/icons-material'
import type { NotificationButtonProps } from '$types/components'

/** Notification bell button with badge count display. */
export default function NotificationButton({ badgeCount = 0, onClick }: NotificationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 rounded-md text-fg-3 hover:text-fg-1 hover:bg-surface-3 transition-colors"
      aria-label="Notifications"
    >
      <Notifications style={{ fontSize: '20px' }} />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[var(--danger)] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  )
}
