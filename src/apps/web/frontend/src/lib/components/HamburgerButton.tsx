import { MenuIcon } from './index'
import type { HamburgerButtonProps } from '$types/components'

/** Fixed-position hamburger button for toggling the sidebar. */
export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 left-6 z-20 w-11 h-11 knik-glass
                 rounded-md flex items-center justify-center text-fg-1 hover:bg-surface-3
                 transition-all duration-base shadow-knik-2 hover:scale-105"
      aria-label="Open sidebar"
    >
      <MenuIcon className="w-5 h-5" />
    </button>
  )
}
