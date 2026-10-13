import type { KbdProps } from '$types'

/** Inline keyboard-key indicator (e.g. ⌘ K). */
export default function Kbd({ children, className = '' }: KbdProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[5px] border border-border-2 bg-panel px-[5px] py-[3px] font-mono text-micro leading-none text-fg-3 ${className}`}
    >
      {children}
    </span>
  )
}
