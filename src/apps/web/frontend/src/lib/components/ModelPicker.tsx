import { useEffect, useRef, useState } from 'react'
import MS from './MS'
import { DEMO_MODELS } from '$lib/constants/redesignData'
import type { DemoModel, AccentBadge } from '$lib/constants/redesignData'

export interface ModelPickerProps {
  model: string
  onChange: (id: string) => void
  compact?: boolean
  models?: DemoModel[]
}

const DOT: Record<AccentBadge, string> = {
  primary: 'var(--acc, var(--aurora-400))',
  teal: 'var(--teal-400)',
  violet: 'var(--violet-400)',
  success: 'var(--success)',
}

/** Inline model selector for the composer / top bar — a small popover of models. */
export default function ModelPicker({
  model,
  onChange,
  compact,
  models = DEMO_MODELS,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const cur = models.find(m => m.id === model) ?? models[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 font-medium transition-all duration-150 ease-knik-out"
        style={{
          padding: compact ? '6px 10px' : '8px 12px',
          borderRadius: 'var(--r-btn, 8px)',
          border: '1px solid var(--border-2)',
          background: 'var(--bg-surface-2)',
          color: 'var(--fg-1)',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[cur.badge] }} />
        {cur.label}
        <MS name="expand_more" size={16} style={{ color: 'var(--fg-4)' }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: compact ? 'auto' : 'calc(100% + 8px)',
            top: compact ? 'calc(100% + 8px)' : 'auto',
            left: 0,
            minWidth: 248,
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
            boxShadow: 'var(--shadow-3)',
            padding: 6,
            zIndex: 40,
            animation: 'knik-fade-up 160ms var(--ease-out) both',
          }}
        >
          {models.map(m => {
            const active = m.id === model
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id)
                  setOpen(false)
                }}
                className="w-full text-left transition-colors duration-150"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 'var(--r-btn, 8px)',
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'var(--acc-soft)' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: DOT[m.badge],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 550, color: 'var(--fg-1)' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-4)' }}>{m.vendor}</div>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--fg-3)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-1)',
                    padding: '2px 6px',
                    borderRadius: 5,
                  }}
                >
                  {m.tag}
                </span>
                {active && (
                  <MS
                    name="check"
                    size={16}
                    style={{ color: 'var(--acc-text, var(--aurora-300))' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
