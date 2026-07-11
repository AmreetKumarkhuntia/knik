import type { LinkButtonProps } from '$types/components'

/** Navigation-style button with active state highlighting. */
export default function LinkButton({
  icon,
  label,
  onClick,
  active = false,
  className = '',
}: LinkButtonProps) {
  const baseClasses =
    'w-full text-left px-4 py-2 rounded-md flex items-center gap-3 knik-interactive'

  const activeClasses = 'bg-[var(--primary-soft)] text-[var(--primary)]'
  const inactiveClasses = 'text-fg-3 hover:bg-surface-3 hover:text-fg-1'

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${className}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}
