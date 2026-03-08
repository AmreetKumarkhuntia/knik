import type { UserProfileProps } from '$types/components'

export default function UserProfile({
  avatar = 'AR',
  avatarColor = 'var(--color-primary)',
  name = 'Alex Rivera',
  account = 'Pro Account',
  displayOnly = true,
  showBadge = true,
  badgeType = 'pro',
}: UserProfileProps) {
  const getBadgeColor = () => {
    switch (badgeType) {
      case 'pro':
        return 'bg-primary'
      case 'admin':
        return 'bg-error'
      case 'basic':
      default:
        return 'bg-surface'
    }
  }

  const getBadgeText = () => {
    switch (badgeType) {
      case 'pro':
        return 'PRO'
      case 'admin':
        return 'ADMIN'
      case 'basic':
        return 'BASIC'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-text font-semibold ${!displayOnly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        style={{ backgroundColor: avatarColor }}
        aria-label={`${name}'s profile`}
      >
        {avatar}
      </div>

      {account && (
        <div className="flex flex-col">
          <span className="text-text font-medium text-sm">{name}</span>
          <span className="text-textSecondary text-xs">{account}</span>
        </div>
      )}

      {showBadge && (
        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getBadgeColor()}`}>
          {getBadgeText()}
        </span>
      )}
    </div>
  )
}
