import { Kbd, MS } from '$components'
import Button from '$components/buttons/Button'
import Breadcrumb from '$components/navigation/Breadcrumb'
import { LAYOUT } from '$lib/constants/dimensions'
import type { TopBarProps } from '$types/widgets/chat-shell'

export default function TopBar({
  crumbs,
  onOpenSearch,
  dark,
  onToggleTheme,
  onOpenNavigation,
}: TopBarProps) {
  return (
    <header
      className="flex items-center flex-shrink-0 px-3 sm:px-6 gap-3 border-b border-border-1"
      style={{ height: LAYOUT.headerHeight }}
    >
      {onOpenNavigation && (
        <Button
          variant="ghost"
          size="sm"
          className="knik-btn--icon rounded-[10px]"
          aria-label="Open navigation"
          onClick={onOpenNavigation}
          icon={<MS name="menu" size={20} />}
        />
      )}
      <div className="min-w-0 overflow-hidden">
        <Breadcrumb items={crumbs.map(label => ({ label }))} />
      </div>
      <div className="flex items-center flex-shrink-0 ml-auto gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="group gap-2 pl-3 pr-2.5 rounded-[10px] border-border-1 bg-panel text-fg-3 text-caption font-medium hover:!bg-panel-2 hover:!border-border-2 max-sm:px-0"
          aria-label="Search commands"
          title="Search commands (⌘K)"
          onClick={onOpenSearch}
          icon={<MS name="search" size={18} />}
        >
          <span className="hidden sm:inline">Search</span>
          <Kbd className="hidden sm:inline-flex bg-transparent group-hover:text-fg-2">⌘K</Kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="knik-btn--icon rounded-[10px] [@media(hover:hover)]:hover:-rotate-[15deg] active:!scale-[.97]"
          aria-label={dark ? 'Light mode' : 'Dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
          icon={<MS name={dark ? 'light_mode' : 'dark_mode'} size={19} />}
        />
      </div>
    </header>
  )
}
