import type { LinkButtonProps } from '$types/components'

export default function LinkButton({
  icon,
  label,
  onClick,
  active = false,
  className = '',
}: LinkButtonProps) {
  const baseClasses = 'w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-all'

  const activeClasses = 'text-white bg-white/10'
  const inactiveClasses = 'text-white/70 hover:text-white hover:bg-white/5'

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
