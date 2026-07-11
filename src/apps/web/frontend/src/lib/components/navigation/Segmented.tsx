import type { SegmentedProps } from '$types'
/** Compact segmented control for mutually-exclusive choices (e.g. status filters). */
export default function Segmented({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedProps) {
  const s =
    size === 'sm' ? { fontSize: 12, padding: '5px 10px' } : { fontSize: 13, padding: '6px 13px' }
  return (
    <div
      className={`inline-flex gap-0.5 ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-btn, 8px)',
        padding: 3,
      }}
    >
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value
        const lbl = typeof o === 'string' ? o : o.label
        const icon = typeof o === 'string' ? null : o.icon
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className="inline-flex items-center gap-1.5 font-medium transition-all duration-150 ease-knik-out"
            style={{
              ...s,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'calc(var(--r-btn, 8px) - 2px)',
              letterSpacing: '-0.01em',
              background: active ? 'var(--bg-surface-3)' : 'transparent',
              color: active ? 'var(--fg-1)' : 'var(--fg-4)',
              boxShadow: active
                ? '0 1px 0 rgba(255,255,255,0.05) inset, 0 1px 3px rgba(0,0,0,0.3)'
                : 'none',
            }}
          >
            {icon}
            {lbl}
          </button>
        )
      })}
    </div>
  )
}
