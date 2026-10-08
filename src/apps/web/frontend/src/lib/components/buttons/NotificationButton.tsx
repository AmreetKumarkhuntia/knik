import type { NotificationButtonProps } from '$types/components'
import Button from './Button'
import MS from '../display/MS'
export default function NotificationButton({
  badgeCount = 0,
  onClick,
  disabled,
  title,
}: NotificationButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Notifications"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="relative"
    >
      <MS name="notifications" size={20} />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 rounded-full bg-[var(--danger)] px-1 text-[10px] text-white">
          {badgeCount}
        </span>
      )}
    </Button>
  )
}
