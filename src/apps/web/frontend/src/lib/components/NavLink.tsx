import type { ComponentType } from 'react'
import { AccountTree, Schedule, Settings } from '@mui/icons-material'
import type { NavLinkProps } from '$types/components'

/** Navigation link with icon, label, and active state styling. */
export function NavLink({ icon, label, active = false, href, onClick }: NavLinkProps) {
  const iconMap: Record<string, ComponentType> = {
    account_tree: AccountTree,
    schedule: Schedule,
    settings: Settings,
  }

  const IconComponent = iconMap[icon]

  if (href) {
    return (
      <a
        href={href}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold tracking-wide transition-all duration-200 rounded-lg ${
          active
            ? 'text-inverse bg-primary shadow-xl'
            : 'text-secondary hover:text-foreground hover:bg-surface'
        }`}
      >
        <IconComponent />
        <p>{label}</p>
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold tracking-wide transition-all duration-200 rounded-lg ${
        active
          ? 'text-inverse bg-primary shadow-xl'
          : 'text-secondary hover:text-foreground hover:bg-surface'
      }`}
    >
      <IconComponent />
      <p>{label}</p>
    </button>
  )
}

export default NavLink
