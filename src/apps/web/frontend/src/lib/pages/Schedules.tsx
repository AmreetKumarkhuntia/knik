import { useState } from 'react'
import ActionButton from '$components/ActionButton'
import ToggleSwitch from '$components/ToggleSwitch'
import MS from '$components/MS'
import { DEMO_SCHEDULES } from '$lib/constants'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEK_COUNTS = [3, 4, 3, 3, 5, 1, 1]

function ScheduleStatus({ status }: { status: 'active' | 'paused' }) {
  const cfg =
    status === 'active'
      ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Active' }
      : { bg: 'rgba(154,166,182,0.16)', color: 'var(--fg-3)', label: 'Paused' }
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
      {cfg.label}
    </span>
  )
}

/** Schedules page: weekly upcoming strip + cron-triggered workflow list. */
export default function Schedules() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(DEMO_SCHEDULES.map(s => [s.id, s.status === 'active']))
  )

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 48px' }}>
        {/* Header */}
        <div className="flex items-end justify-between" style={{ marginBottom: 14, gap: 16 }}>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: 'var(--fg-1)',
                margin: 0,
              }}
            >
              Schedules
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>
              Cron-triggered workflow runs
            </div>
          </div>
          <ActionButton
            variant="primary"
            size="sm"
            icon={<MS name="add" size={16} />}
            label="New schedule"
          />
        </div>

        {/* This week strip */}
        <div
          style={{
            marginBottom: 26,
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
            padding: 'var(--pad-card, 18px)',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>This week</div>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
              Mar 16 – 22 · UTC
            </span>
          </div>
          <div className="grid grid-cols-7" style={{ gap: 8 }}>
            {DAYS.map((d, i) => {
              const count = WEEK_COUNTS[i]
              const today = i === 1
              return (
                <div
                  key={d}
                  className="text-center"
                  style={{
                    borderRadius: 'var(--r-btn, 8px)',
                    border: `1px solid ${today ? 'var(--acc-border, rgba(0,217,244,0.4))' : 'var(--border-1)'}`,
                    background: today ? 'var(--acc-soft)' : 'var(--bg-surface)',
                    padding: '10px 10px 12px',
                  }}
                >
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 10.5,
                      color: today ? 'var(--acc-text, var(--aurora-300))' : 'var(--fg-4)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {d}
                  </div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 600,
                      color: 'var(--fg-1)',
                      marginTop: 4,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {16 + i}
                  </div>
                  <div
                    className="flex justify-center flex-wrap"
                    style={{ gap: 3, marginTop: 8, minHeight: 8 }}
                  >
                    {Array.from({ length: count }).map((_, k) => (
                      <span
                        key={k}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: today ? 'var(--acc, var(--aurora-400))' : 'var(--fg-5)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cron list */}
        <div
          style={{
            overflow: 'hidden',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
          }}
        >
          {DEMO_SCHEDULES.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center"
              style={{
                gap: 16,
                padding: '15px 18px',
                borderBottom:
                  i === DEMO_SCHEDULES.length - 1 ? 'none' : '1px solid var(--border-1)',
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--r-btn, 8px)',
                  background: s.status === 'active' ? 'var(--acc-soft)' : 'var(--bg-surface-3)',
                  color:
                    s.status === 'active' ? 'var(--acc-text, var(--aurora-300))' : 'var(--fg-4)',
                }}
              >
                <MS name="schedule" size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}>{s.wf}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 1 }}>{s.human}</div>
              </div>
              <code
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: 'var(--fg-2)',
                  background: 'var(--bg-code)',
                  border: '1px solid var(--border-1)',
                  padding: '4px 9px',
                  borderRadius: 6,
                }}
              >
                {s.cron}
              </code>
              <div style={{ width: 150, textAlign: 'right' }}>
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 500 }}>
                  {s.next}
                </div>
                <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-5)' }}>
                  {s.tz}
                </div>
              </div>
              <ScheduleStatus status={enabled[s.id] ? 'active' : 'paused'} />
              <ToggleSwitch
                checked={enabled[s.id]}
                onChange={v => setEnabled(prev => ({ ...prev, [s.id]: v }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
