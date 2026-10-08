import { MS } from '$components'
import NavLink from '$components/navigation/NavLink'
import { NAV_ITEMS } from '$lib/constants/navigation'
import type { SidebarNavProps } from '$types/widgets/chat-shell'

export default function SidebarNav({ collapsed, pathname, onNavigate }: SidebarNavProps) {
  return (
    <>
      <nav aria-label="Workspace" className="flex flex-col" style={{ gap: 2 }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            href={item.path}
            icon={<MS name={item.icon} size={20} fill={pathname === item.path ? 1 : 0} />}
            label={item.label}
            active={pathname === item.path}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>
    </>
  )
}
