import type { StatusPillProps } from '$types'
import { STATUS_PILL_TONES } from '$lib/constants'

/** Small inline status pill: colored dot + label. */
export default function StatusPill({ tone, label }: StatusPillProps) {
  const cfg = STATUS_PILL_TONES[tone]
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        gap: 6,
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 999,
        fontSize: 11,
        padding: '3px 8px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {label}
    </span>
  )
}
