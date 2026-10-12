import { Link } from 'react-router-dom'
import type { NavLinkProps } from '$types/components'
export default function NavLink({
  icon,
  label,
  active = false,
  href,
  onClick,
  collapsed,
}: NavLinkProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`knik-focus min-w-0 min-h-11 md:min-h-9 flex items-center gap-2 px-3 py-2 text-label transition-colors rounded-md ${active ? 'text-[var(--acc-text)] bg-[var(--acc-soft)]' : 'text-fg-3 hover:text-fg-1 hover:bg-surface-3'}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      {!collapsed && <span className="truncate min-w-0">{label}</span>}
    </Link>
  )
}
