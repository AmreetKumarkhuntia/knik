import { Avatar } from '$components'
import NavLink from '$components/navigation/NavLink'
import { ROUTES } from '$lib/constants/navigation'
import type { SidebarAccountProps } from '$types/widgets/chat-shell'

export default function SidebarAccount({
  collapsed,
  name,
  initials,
  onNavigate,
}: SidebarAccountProps) {
  return (
    <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border-1)' }}>
      <NavLink
        href={ROUTES.settings}
        icon={<Avatar initials={initials} size={collapsed ? 32 : 30} color="accent" />}
        label={name || 'Session account'}
        collapsed={collapsed}
        onClick={onNavigate}
      />
    </div>
  )
}
