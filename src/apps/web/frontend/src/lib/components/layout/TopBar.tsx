import { MS } from '$components'
import Button from '$components/buttons/Button'
import Breadcrumb from '$components/navigation/Breadcrumb'
import NotificationButton from '$components/buttons/NotificationButton'
import SearchLauncher from './SearchLauncher'
import type { TopBarProps } from '$types/widgets/chat-shell'

export default function TopBar({ crumbs, right, onOpenSearch, dark, onToggleTheme }: TopBarProps) {
  return (
    <header
      className="flex items-center flex-shrink-0 relative flex-wrap sm:flex-nowrap"
      style={{
        minHeight: 64,
        padding: '12px 24px',
        gap: 16,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: '1px solid var(--border-2)',
        zIndex: 5,
      }}
    >
      <Breadcrumb items={crumbs.map(label => ({ label }))} />
      <SearchLauncher
        onClick={onOpenSearch}
        label="Search or run a command…"
        className="hidden md:flex flex-1 max-w-[460px] mx-auto"
      />
      <div className="flex items-center flex-shrink-0 ml-auto" style={{ gap: 8 }}>
        {right}
        <Button
          variant="ghost"
          size="sm"
          aria-label={dark ? 'Light mode' : 'Dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
          icon={<MS name={dark ? 'light_mode' : 'dark_mode'} size={19} />}
        />
        <NotificationButton
          badgeCount={0}
          disabled
          title="Notifications unavailable until demo data is supplied"
        />
      </div>
    </header>
  )
}
