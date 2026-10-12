import Avatar from '$components/display/Avatar'
import type { ProfileSummaryProps } from '$types/widgets/settings'

export default function ProfileSummary({ displayName, initials }: ProfileSummaryProps) {
  return (
    <div className="flex items-center gap-4 pb-4 mb-1.5 border-b border-[var(--border-1)]">
      <Avatar initials={initials} size={56} color="accent" />
      <div className="flex-1">
        <div className="text-h3 text-[var(--fg-1)]">{displayName || 'Local account'}</div>
        <div className="flex items-center gap-1.5 text-body-sm text-[var(--fg-4)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
          Local account · this session
        </div>
      </div>
    </div>
  )
}
