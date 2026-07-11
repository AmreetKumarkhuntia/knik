import type { PaneHeaderProps } from '$types'

/** Page/section header: title + optional subtitle on the left, optional action on the right. */
export default function PaneHeader({ title, subtitle, right, style }: PaneHeaderProps) {
  return (
    <div className="flex items-end justify-between" style={{ marginBottom: 14, gap: 16, ...style }}>
      <div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.015em',
            color: 'var(--fg-1)',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  )
}
