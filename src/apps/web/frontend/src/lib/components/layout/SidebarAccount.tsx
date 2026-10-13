import { Avatar } from '$components'
import NavLink from '$components/navigation/NavLink'
import { ROUTES } from '$lib/constants/navigation'
import type { SidebarAccountProps } from '$types/widgets/chat-shell'

export default function SidebarAccount({
  collapsed,
  name,
  initials,
  onNavigate,
  active = false,
}: SidebarAccountProps) {
  return (
    <div className="mt-2.5 pt-3 border-t border-border-1 md:[&>a]:min-h-10 [&>a]:px-2 [&>a]:text-fg-2 [&>a:hover]:text-fg-1">
      <NavLink
        href={ROUTES.settings}
        icon={<Avatar initials={initials} size={30} color="accent" />}
        label={name || 'Session account'}
        active={active}
        collapsed={collapsed}
        onClick={onNavigate}
      />
    </div>
  )
}
