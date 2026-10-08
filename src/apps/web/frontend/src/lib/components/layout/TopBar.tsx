import { MS } from '$components'
import Button from '$components/buttons/Button'
import Breadcrumb from '$components/navigation/Breadcrumb'
import type { TopBarProps } from '$types/widgets/chat-shell'

export default function TopBar({
  crumbs,
  right,
  onOpenSearch,
  dark,
  onToggleTheme,
  onOpenNavigation,
}: TopBarProps) {
  return (
    <header className="flex items-center flex-shrink-0 h-[52px] px-3 sm:px-6 gap-3 border-b border-border bg-background">
      {onOpenNavigation && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Open navigation"
          onClick={onOpenNavigation}
          icon={<MS name="menu" size={20} />}
        />
      )}
      <div className="min-w-0 overflow-hidden">
        <Breadcrumb items={crumbs.map(label => ({ label }))} />
      </div>
      <div className="flex items-center flex-shrink-0 ml-auto gap-1">
        {right}
        <Button
          variant="ghost"
          size="sm"
          aria-label="Search commands"
          title="Search commands (⌘K)"
          onClick={onOpenSearch}
          icon={<MS name="search" size={19} />}
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label={dark ? 'Light mode' : 'Dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
          icon={<MS name={dark ? 'light_mode' : 'dark_mode'} size={19} />}
        />
      </div>
    </header>
  )
}
