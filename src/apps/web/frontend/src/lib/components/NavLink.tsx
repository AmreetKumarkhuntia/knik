import type { ComponentType } from 'react'
import { AccountTree, Schedule, Settings } from '@mui/icons-material'

interface NavLinkProps {
  icon: string
  label: string
  active?: boolean
  href?: string
  onClick?: () => void
}

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
            ? 'text-white bg-primary shadow-xl'
            : 'text-textSecondary hover:text-text hover:bg-white/5'
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
          ? 'text-white bg-primary shadow-xl'
          : 'text-textSecondary hover:text-text hover:bg-white/5'
      }`}
    >
      <IconComponent />
      <p>{label}</p>
    </button>
  )
}

export default NavLink
