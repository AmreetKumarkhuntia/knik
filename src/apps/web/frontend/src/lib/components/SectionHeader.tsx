export interface SectionHeaderProps {
  title: string
  actionText?: string
  onActionClick?: () => void
  badge?: string
  className?: string
}

export default function SectionHeader({
  title,
  actionText,
  onActionClick,
  badge,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-2 ${className}`}>
      <div className="flex items-center gap-3">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            {badge}
          </span>
        )}
      </div>
      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="text-primary text-sm font-semibold hover:underline"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}
