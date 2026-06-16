import { useState } from 'react'
import type { ActionIconProps } from '$types'

/**
 * Compact icon button with token-driven hover/active states — the redesign's
 * ubiquitous toolbar affordance (chat actions, table row actions, zoom, etc.).
 */
export default function ActionIcon({
  icon,
  onClick,
  title,
  size = 34,
  active = false,
  danger = false,
  className = '',
}: ActionIconProps) {
  const [h, setH] = useState(false)
  const bg = active ? 'var(--acc-soft)' : h ? 'var(--bg-surface-3)' : 'transparent'
  const color = danger
    ? 'var(--danger)'
    : active
      ? 'var(--acc-text, var(--aurora-200))'
      : h
        ? 'var(--fg-1)'
        : 'var(--fg-3)'
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className={`inline-flex items-center justify-center flex-shrink-0 transition-all duration-150 ease-knik-out ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--r-btn, 8px)',
        border: 'none',
        background: bg,
        color,
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  )
}
