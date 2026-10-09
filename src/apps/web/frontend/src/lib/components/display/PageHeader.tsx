import Button from '$components/buttons/Button'
import type { PageHeaderProps } from '$types/components'

/** Page header bar with breadcrumbs and optional right-side content. */
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
      className={`min-h-[52px] gap-3 border-b border-[var(--border-2)] bg-surface flex flex-wrap items-center justify-between px-4 py-2 ${stickyClasses}`}
    >
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button
            variant="ghost"
            onClick={onBackClick}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-surface-3 transition-colors"
            title="Back"
            aria-label="Back"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
          </Button>
        )}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <div key={index} className="flex items-center gap-2">
              <span className={`font-medium ${isLast ? 'text-fg-1 font-semibold' : 'text-fg-3'}`}>
                {crumb}
              </span>
              {!isLast && (
                <span className="material-symbols-outlined text-fg-4 text-sm" aria-hidden="true">
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
