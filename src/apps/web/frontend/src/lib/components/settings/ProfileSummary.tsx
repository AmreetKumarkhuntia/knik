import Avatar from '$components/display/Avatar'
import type { ProfileSummaryProps } from '$types/widgets/settings'

export default function ProfileSummary({ displayName }: ProfileSummaryProps) {
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase() || 'AI'
  return (
    <div className="flex items-center gap-4 pb-4 mb-1.5 border-b border-[var(--border-1)]">
      <Avatar initials={initials} size={56} color="accent" />
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-[var(--fg-1)]">
          {displayName || 'Local account'}
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--fg-4)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
          Local account · this session
        </div>
      </div>
    </div>
  )
}
