import Avatar from '$components/display/Avatar'
import type { ProfileSummaryProps } from '$types/widgets/settings'

export default function ProfileSummary({ displayName, initials }: ProfileSummaryProps) {
  return (
    <div className="flex items-center gap-3.5 border-b border-border-1 py-3.5">
      <Avatar initials={initials} size={48} color="accent" />
      <div className="min-w-0 flex-1">
        <div className="break-words text-body-lg font-semibold text-fg-1">
          {displayName || 'Local account'}
        </div>
        <div className="flex items-center gap-1.5 text-body-sm text-fg-3">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
          Local account · this session
        </div>
      </div>
    </div>
  )
}
