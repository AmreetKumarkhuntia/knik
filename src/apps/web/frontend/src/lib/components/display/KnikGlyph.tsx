import type { KnikGlyphProps } from '$types'

/**
 * The KNIK brand mark — five teal strokes forming a sound-wave
 * silhouette. Used in the sidebar brand, chat hero, and assistant avatar.
 */
export default function KnikGlyph({ size = 22, className }: KnikGlyphProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <g stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round">
        <line x1="5" y1="12" x2="5" y2="12" />
        <line x1="8.5" y1="9" x2="8.5" y2="15" />
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="15.5" y1="8" x2="15.5" y2="16" />
        <line x1="19" y1="10" x2="19" y2="14" />
      </g>
    </svg>
  )
}
