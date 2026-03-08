import { Notifications } from '@mui/icons-material'

interface NotificationButtonProps {
  badgeCount?: number
  onClick?: () => void
}

export default function NotificationButton({ badgeCount = 0, onClick }: NotificationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-textSecondary hover:text-text hover:bg-white/5 transition-colors"
      aria-label="Notifications"
    >
      <Notifications style={{ fontSize: '20px' }} />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  )
}
