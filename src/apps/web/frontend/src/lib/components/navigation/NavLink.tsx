import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MOTION_EASE_SPRING } from '$lib/constants/motion'
import type { NavLinkProps } from '$types/components'

export default function NavLink({
  icon,
  label,
  active = false,
  href,
  onClick,
  collapsed,
  highlightId,
}: NavLinkProps) {
  const tone = active
    ? `text-[var(--acc-text)] ${highlightId ? '' : 'bg-[var(--acc-soft)]'}`
    : 'text-fg-3 hover:text-fg-1 hover:bg-panel-2'
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`knik-focus relative min-w-0 min-h-11 md:min-h-9 flex items-center gap-[9px] px-3 rounded-[11px] text-label transition-colors duration-base ease-out ${collapsed ? 'justify-center' : ''} ${tone}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      {active && highlightId && (
        <motion.span
          layoutId={highlightId}
          aria-hidden="true"
          className="absolute inset-0 rounded-[11px] bg-[var(--acc-soft)] shadow-[inset_0_0_0_1px_var(--acc-border)]"
          transition={{ duration: 0.5, ease: MOTION_EASE_SPRING }}
        />
      )}
      {/* Positioned so the content paints above the absolutely placed highlight. */}
      <span className="relative z-10 inline-flex shrink-0">{icon}</span>
      {!collapsed && <span className="relative z-10 truncate min-w-0">{label}</span>}
    </Link>
  )
}
