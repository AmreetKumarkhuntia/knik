import { useState } from 'react'
import { MS } from '$components'
import type { RunBarProps } from '$types'
import { DEMO_RUN_LOGS } from '$lib/constants'

/** Floating run bar: live status + step progress + collapsible log stream. */
export default function RunBar({ onClose }: RunBarProps) {
  const [showLogs, setShowLogs] = useState(false)

  return (
    <div
      className="absolute"
      style={{
        left: 16,
        right: 16,
        bottom: 16,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid var(--border-2)',
        borderRadius: 'var(--r-card, 12px)',
        boxShadow: 'var(--shadow-2)',
        overflow: 'hidden',
        zIndex: 20,
      }}
    >
      <div className="flex items-center" style={{ gap: 14, padding: '11px 14px' }}>
        <span
          className="inline-flex items-center"
          style={{ gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              border: '1.5px solid var(--acc-text, var(--aurora-300))',
              borderTopColor: 'transparent',
              animation: 'knik-spin 0.9s linear infinite',
            }}
          />
          Running
        </span>
        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
          Daily digest · step 4 / 7
        </span>
        <div
          style={{
            flex: 1,
            height: 5,
            borderRadius: 999,
            background: 'var(--bg-surface-3)',
            overflow: 'hidden',
            maxWidth: 320,
          }}
        >
          <div
            style={{
              width: '57%',
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, var(--acc, var(--aurora-400)), var(--teal-400))',
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>
          4.1s
        </span>
        <button
          type="button"
          onClick={() => setShowLogs(s => !s)}
          className="inline-flex items-center font-medium"
          style={{
            gap: 5,
            border: '1px solid var(--border-2)',
            background: 'var(--bg-surface-2)',
            color: 'var(--fg-2)',
            borderRadius: 'var(--r-btn, 8px)',
            padding: '6px 10px',
            fontSize: 12.5,
            cursor: 'pointer',
          }}
        >
          <MS name="terminal" size={15} />
          Logs
          <MS name={showLogs ? 'expand_more' : 'expand_less'} size={15} />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss run bar"
            className="inline-flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--r-btn, 8px)',
              border: 'none',
              background: 'transparent',
              color: 'var(--fg-4)',
              cursor: 'pointer',
            }}
          >
            <MS name="close" size={16} />
          </button>
        )}
      </div>
      {showLogs && (
        <div
          className="scrollbar-hide"
          style={{
            borderTop: '1px solid var(--border-1)',
            padding: '10px 14px',
            background: 'var(--bg-code)',
            maxHeight: 110,
            overflowY: 'auto',
            animation: 'knik-fade-up 200ms var(--ease-out) both',
          }}
        >
          {DEMO_RUN_LOGS.map((l, i) => (
            <div
              key={i}
              className="flex font-mono"
              style={{ gap: 12, fontSize: 11.5, lineHeight: 1.8 }}
            >
              <span style={{ color: 'var(--fg-5)' }}>{l.t}</span>
              <span style={{ color: l.c }}>{l.m}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
