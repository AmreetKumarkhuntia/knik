import type { ReactNode, CSSProperties } from 'react'

/** A status pill tone (drives background + foreground color). */
export interface StatusPillProps {
  tone: 'success' | 'neutral'
  label: string
}

/** Titled settings group (surface card + header block). */
export interface FormGroupProps {
  title: string
  sub?: string
  children: ReactNode
}

/** A labelled settings row: label/hint on the left, control on the right. */
export interface FormRowProps {
  label: string
  hint?: string
  children: ReactNode
  last?: boolean
}

/** Search input with a leading icon and focus ring. */
export interface SearchFieldProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/** Small mono section label. */
export interface EyebrowProps {
  children: ReactNode
}

/** Centered loading spinner — full-screen or block-level. */
export interface FullScreenLoaderProps {
  variant?: 'screen' | 'block'
}

/** Centered error message with an optional Go Back button. */
export interface FullScreenErrorProps {
  message: string
  onBack?: () => void
  layout: 'screen' | 'fill'
}

/** Page/section header: title + optional subtitle + optional right-side action. */
export interface PaneHeaderProps {
  title: string
  subtitle?: string
  right?: ReactNode
  style?: CSSProperties
}

/** Panel surface (bg-surface-2 + hairline border + card radius). */
export interface SurfaceCardProps {
  children: ReactNode
  padded?: boolean
  className?: string
  style?: CSSProperties
}

/** Square icon chip. */
export interface IconTileProps {
  icon: ReactNode
  size?: number
  bg: string
  color: string
}
