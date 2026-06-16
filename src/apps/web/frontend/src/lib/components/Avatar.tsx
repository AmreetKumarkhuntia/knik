export interface AvatarProps {
  initials: string
  size?: number
  color?: 'surface' | 'accent'
  className?: string
}

/** Compact initials avatar; the accent variant uses a subtle aurora→teal fill. */
export default function Avatar({ initials, size = 30, color = 'surface', className }: AvatarProps) {
  const isAccent = color === 'accent'
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        flexShrink: 0,
        background: isAccent
          ? 'linear-gradient(135deg, var(--acc-soft), rgba(20,184,166,0.22))'
          : 'var(--bg-surface-3)',
        border: isAccent
          ? '1px solid var(--acc-border, rgba(0,217,244,0.4))'
          : '1px solid var(--border-2)',
        color: 'var(--fg-1)',
        fontFamily: 'var(--font-mono)',
        fontSize: size * 0.36,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  )
}
