import type { EyebrowProps } from '$types'

export default function Eyebrow({ children }: EyebrowProps) {
  return (
    <div
      className="text-xs font-medium"
      style={{
        color: 'var(--fg-4)',
        padding: '10px 11px 7px',
      }}
    >
      {children}
    </div>
  )
}
