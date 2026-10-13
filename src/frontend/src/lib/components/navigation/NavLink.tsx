import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MOTION_DURATION, MOTION_EASE_SPRING } from '$lib/constants/motion'
import type { NavLinkProps } from '$types/components'

export default function NavLink({
  icon,
  label,
  active = false,
  href,
  onClick,
  collapsed,
  highlightId,
  variant = 'nav',
}: NavLinkProps) {
  const account = variant === 'account'
  const fill = active ? (highlightId ? '' : 'bg-[var(--acc-soft)]') : 'hover:bg-panel-2'
  const text = account
    ? 'text-fg-2 hover:text-fg-1'
    : active
      ? 'text-[var(--acc-text)]'
      : 'text-fg-3 hover:text-fg-1'
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`knik-focus relative min-w-0 min-h-11 flex items-center gap-[9px] rounded-[11px] text-label transition-colors duration-base ease-out ${account ? 'px-2 md:min-h-10' : 'px-3 md:min-h-9'} ${collapsed ? 'justify-center' : ''} ${fill} ${text}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      {active && highlightId && (
        <motion.span
          layoutId={highlightId}
          aria-hidden="true"
          className="absolute inset-0 rounded-[11px] bg-[var(--acc-soft)] shadow-[inset_0_0_0_1px_var(--acc-border)]"
          transition={{ duration: MOTION_DURATION.pill, ease: MOTION_EASE_SPRING }}
        />
      )}
      {/* Positioned so the content paints above the absolutely placed highlight. */}
      <span className="relative z-10 inline-flex shrink-0">{icon}</span>
      {!collapsed && <span className="relative z-10 truncate min-w-0">{label}</span>}
    </Link>
  )
}
