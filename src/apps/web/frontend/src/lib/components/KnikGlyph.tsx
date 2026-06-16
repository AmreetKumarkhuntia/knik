import { useId } from 'react'

export interface KnikGlyphProps {
  size?: number
  glow?: boolean
  className?: string
}

/**
 * The KNIK brand mark — five aurora→teal gradient strokes forming a sound-wave
 * silhouette. Used in the sidebar brand, chat hero, and assistant avatar.
 */
export default function KnikGlyph({ size = 22, glow = true, className }: KnikGlyphProps) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="var(--aurora-200)" />
          <stop offset="55%" stopColor="var(--aurora-400)" />
          <stop offset="100%" stopColor="var(--teal-500)" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${id})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        style={
          glow
            ? { filter: 'drop-shadow(0 0 6px var(--acc-glow, rgba(0,217,244,0.55)))' }
            : undefined
        }
      >
        <line x1="5" y1="12" x2="5" y2="12" />
        <line x1="8.5" y1="9" x2="8.5" y2="15" />
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="15.5" y1="8" x2="15.5" y2="16" />
        <line x1="19" y1="10" x2="19" y2="14" />
      </g>
    </svg>
  )
}
