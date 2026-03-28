import type { LinkButtonProps } from '$types/components'

/** Navigation-style button with active state highlighting. */
export default function LinkButton({
  icon,
  label,
  onClick,
  active = false,
  className = '',
}: LinkButtonProps) {
  const baseClasses = 'w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-all'

  const activeClasses = 'text-foreground bg-surfaceRaised'
  const inactiveClasses = 'text-foreground/70 hover:text-foreground hover:bg-surface'

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
