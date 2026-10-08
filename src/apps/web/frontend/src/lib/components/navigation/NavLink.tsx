import { Link } from 'react-router-dom'
import type { NavLinkProps } from '$types/components'
import MS from '../display/MS'
import Button from '../buttons/Button'
export default function NavLink({
  icon,
  label,
  active = false,
  href,
  onClick,
  collapsed,
  className = '',
  style,
}: NavLinkProps) {
  const content = (
    <>
      {typeof icon === 'string' ? <MS name={icon} size={19} /> : icon}
      {!collapsed && <span>{label}</span>}
    </>
  )
  const classes = `flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md ${active ? 'text-[var(--acc-text)] bg-[var(--acc-soft)]' : 'text-fg-3 hover:text-fg-1 hover:bg-surface-3'} ${className}`
  const props = {
    className: classes,
    style,
    title: collapsed ? label : undefined,
    'aria-label': collapsed ? label : undefined,
    'aria-current': active ? ('page' as const) : undefined,
  }
  if (href?.startsWith('/'))
    return (
      <Link {...props} to={href} onClick={onClick}>
        {content}
      </Link>
    )
  if (href)
    return (
      <a {...props} href={href} onClick={onClick}>
        {content}
      </a>
    )
  return (
    <Button {...props} variant="ghost" onClick={onClick}>
      {content}
    </Button>
  )
}
