import Button from '$components/buttons/Button'
import { Kbd, MS } from '$components'
import type { SearchLauncherProps } from '$types/widgets/chat-shell'

export default function SearchLauncher({
  onClick,
  label = 'Search…',
  className = '',
}: SearchLauncherProps) {
  return (
    <Button
      onClick={onClick}
      className={`flex items-center transition-all ease-knik-out ${className}`}
      style={{
        gap: 9,
        padding: '8px 12px',
        width: '100%',
        borderRadius: 'var(--r-btn, 8px)',
        border: '1px solid var(--border-2)',
        cursor: 'pointer',
        background: 'var(--bg-surface)',
        color: 'var(--fg-4)',
        fontSize: 13,
      }}
    >
      <MS name="search" size={18} />
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <Kbd>⌘K</Kbd>
    </Button>
  )
}
