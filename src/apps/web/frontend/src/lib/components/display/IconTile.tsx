import type { IconTileProps } from '$types'

/** Square icon chip with configurable size and colors. */
export default function IconTile({ icon, size = 34, bg, color }: IconTileProps) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--r-btn, 8px)',
        background: bg,
        color,
      }}
    >
      {icon}
    </div>
  )
}
