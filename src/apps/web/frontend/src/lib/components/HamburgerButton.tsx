import { MenuIcon } from './index'
import type { HamburgerButtonProps } from '$types/components'

export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 left-6 z-20 w-11 h-11 bg-surfaceRaised backdrop-blur-3xl border border-border
                 rounded-lg flex items-center justify-center text-foreground hover:bg-surface
                 transition-all duration-200 shadow-2xl hover:scale-105"
      aria-label="Open sidebar"
    >
      <MenuIcon className="w-5 h-5" />
    </button>
  )
}
