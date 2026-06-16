import type { CSSProperties } from 'react'

export interface MSProps {
  name: string
  size?: number
  fill?: 0 | 1
  weight?: number
  grade?: number
  className?: string
  style?: CSSProperties
}

/**
 * Material Symbols (Outlined) glyph helper. The font is loaded globally in
 * tokens.css; this wraps the `.material-symbols-outlined` span and exposes the
 * variable-font axes (fill / weight / optical size) used across the redesign.
 */
export default function MS({
  name,
  size = 20,
  fill = 0,
  weight = 400,
  grade = 0,
  className = '',
  style,
}: MSProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`,
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {name}
    </span>
  )
}
