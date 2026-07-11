import type { SurfaceCardProps } from '$types'

/** Panel surface: bg-surface-2 with a hairline border and card radius. */
export default function SurfaceCard({ children, padded, className, style }: SurfaceCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-card, 12px)',
        ...(padded ? { padding: 'var(--pad-card, 18px)' } : { overflow: 'hidden' }),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
