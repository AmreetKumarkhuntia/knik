import type { CSSProperties } from 'react'
import type { KnikGlyphProps } from '$types'

/**
 * The KNIK brand mark: five accent bars forming a sound-wave silhouette, sized by --glyph-size.
 * Used in the sidebar brand, chat hero and assistant avatar.
 */
export default function KnikGlyph({ size = 22, animated = false, className = '' }: KnikGlyphProps) {
  return (
    <span
      aria-hidden="true"
      className={`knik-glyph ${animated ? 'knik-glyph--animated' : ''} ${className}`}
      style={{ '--glyph-size': `${size}px` } as CSSProperties}
    >
      <i className="knik-glyph__bar" />
      <i className="knik-glyph__bar" />
      <i className="knik-glyph__bar" />
      <i className="knik-glyph__bar" />
      <i className="knik-glyph__bar" />
    </span>
  )
}
