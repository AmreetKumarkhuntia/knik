import type { KbdProps } from '$types'

/** Inline keyboard-key indicator (e.g. ⌘ K). */
export default function Kbd({ children, className = '' }: KbdProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-mono ${className}`}
      style={{
        background: 'var(--bg-surface-3)',
        border: '1px solid var(--border-2)',
        borderRadius: 4,
        padding: '1px 5px',
        color: 'var(--fg-3)',
        fontSize: 10.5,
        lineHeight: 1.6,
      }}
    >
      {children}
    </span>
  )
}
