import type { EyebrowProps } from '$types'

/** Small mono section label. */
export default function Eyebrow({ children }: EyebrowProps) {
  return (
    <div
      className="font-mono uppercase"
      style={{
        fontSize: 10,
        letterSpacing: '0.09em',
        color: 'var(--fg-4)',
        padding: '10px 11px 7px',
      }}
    >
      {children}
    </div>
  )
}
