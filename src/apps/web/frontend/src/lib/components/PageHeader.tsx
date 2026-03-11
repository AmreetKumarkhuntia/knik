import type { PageHeaderProps } from '$types/components'

export default function PageHeader({
  breadcrumbs,
  rightContent,
  showBackButton = false,
  onBackClick,
  sticky = false,
}: PageHeaderProps) {
  const stickyClasses = sticky ? 'sticky top-0 z-10 shrink-0' : ''

  return (
    <header
      className={`h-16 border-b border-white/5 glass flex items-center justify-between px-8 ${stickyClasses}`}
    >
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={onBackClick}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            title="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <div key={index} className="flex items-center gap-2">
              <span
                className={`font-medium ${
                  isLast ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-400'
                }`}
              >
                {crumb}
              </span>
              {!isLast && (
                <span className="material-symbols-outlined text-slate-400 text-sm">
                  chevron_right
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center">{rightContent}</div>
    </header>
  )
}
