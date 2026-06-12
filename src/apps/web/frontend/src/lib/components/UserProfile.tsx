import type { UserProfileProps } from '$types/components'
import { USER_PROFILE_DEFAULTS, UI_TEXT, BADGE, STYLE_CONFIG, ACCOUNT } from '$lib/constants'

/** User avatar with name, account info, and optional badge. */
export default function UserProfile({
  avatar = USER_PROFILE_DEFAULTS.initials,
  avatarColor = USER_PROFILE_DEFAULTS.avatarColor,
  name = USER_PROFILE_DEFAULTS.name,
  account = USER_PROFILE_DEFAULTS.accountType,
  displayOnly = USER_PROFILE_DEFAULTS.displayOnly,
  showBadge = USER_PROFILE_DEFAULTS.showBadge,
  badgeType = USER_PROFILE_DEFAULTS.badgeType,
}: UserProfileProps) {
  const getBadgeColor = () => {
    switch (badgeType) {
      case BADGE.types.pro:
        return `${STYLE_CONFIG.badgeTypes.pro.bg} ${STYLE_CONFIG.badgeTypes.pro.text}`
      case BADGE.types.admin:
        return `${STYLE_CONFIG.badgeTypes.admin.bg} ${STYLE_CONFIG.badgeTypes.admin.text}`
      case BADGE.types.basic:
      default:
        return `${STYLE_CONFIG.badgeTypes.basic.bg} ${STYLE_CONFIG.badgeTypes.basic.text}`
    }
  }

  const getBadgeText = () => {
    switch (badgeType) {
      case BADGE.types.pro:
        return UI_TEXT.status.pro
      case BADGE.types.admin:
        return UI_TEXT.status.admin
      case BADGE.types.basic:
        return UI_TEXT.status.basic
      default:
        return ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-fg-1 font-semibold ${!displayOnly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        style={{ backgroundColor: avatarColor }}
        aria-label={ACCOUNT.profileLabel(name)}
      >
        {avatar}
      </div>

      {account && (
        <div className="flex flex-col">
          <span className="text-fg-1 font-medium text-sm">{name}</span>
          <span className="text-fg-3 text-xs">{account}</span>
        </div>
      )}

      {showBadge && (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeColor()}`}>
          {getBadgeText()}
        </span>
      )}
    </div>
  )
}
