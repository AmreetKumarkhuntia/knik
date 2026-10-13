import type { AvatarProps } from '$types'
/** Circular initials avatar; the accent variant marks the signed-in account. */
export default function Avatar({
  initials,
  size = 30,
  color = 'surface',
  className = '',
}: AvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-sans font-semibold leading-none ${
        color === 'accent'
          ? 'bg-[var(--acc-soft)] border-[var(--acc-border)] text-[var(--acc-text)]'
          : 'bg-panel-3 border-border-2 text-fg-1'
      } ${className}`}
      // Initials scale with the avatar, which no fixed type-scale step can do.
      style={{ width: size, height: size, fontSize: Math.round(size * 0.37) }}
    >
      {initials}
    </div>
  )
}
