import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '$components/MetricCard'
import SparklineChart from '$components/charts/SparklineChart'
import Segmented from '$components/Segmented'
import ActionIcon from '$components/ActionIcon'
import MS from '$components/MS'
import {
  DEMO_METRICS,
  DEMO_WORKFLOWS,
  DEMO_EXECUTIONS,
  HUB_METRIC_COLOR as METRIC_COLOR,
  HUB_TREND_DIR as TREND_DIR,
  HUB_EXEC_ICON as EXEC_ICON,
  type DemoWorkflow,
} from '$lib/constants'

/** Small inline status pill (workflow active/paused). */
function WorkflowStatus({ status }: { status: 'active' | 'paused' }) {
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

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [f, setF] = useState(false)
  return (
    <div
      className="flex items-center"
      style={{
        gap: 8,
        padding: '7px 11px',
        width: 220,
        borderRadius: 'var(--r-btn, 8px)',
        background: 'var(--bg-surface)',
        border: `1px solid ${f ? 'var(--acc-border, rgba(0,217,244,0.45))' : 'var(--border-2)'}`,
        transition: 'all 150ms var(--ease-out)',
      }}
    >
      <MS name="search" size={16} style={{ color: 'var(--fg-4)' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search workflows…"
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        className="flex-1 border-none outline-none bg-transparent font-sans min-w-0"
        style={{ color: 'var(--fg-1)', fontSize: 13 }}
      />
    </div>
  )
}

/** Dashboard hub: metric strip, searchable workflows table, recent executions feed. */
export default function WorkflowHub() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const rows: DemoWorkflow[] = DEMO_WORKFLOWS.filter(
    w => (filter === 'all' || w.status === filter) && w.name.toLowerCase().includes(q.toLowerCase())
  )

  const td: React.CSSProperties = { padding: '13px 18px' }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 48px' }}>
        {/* Metric strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14, marginBottom: 30 }}>
          {DEMO_METRICS.map((m, i) => (
            <MetricCard
              key={i}
              icon={m.icon}
              label={m.label}
              value={m.value}
              subtext={m.sub}
              trend={{ direction: TREND_DIR[m.trend.dir], value: m.trend.value }}
              color={METRIC_COLOR[m.color]}
            />
          ))}
        </div>

        {/* Workflows toolbar */}
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
              Workflows
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>
              {rows.length} of {DEMO_WORKFLOWS.length} shown
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            <SearchField value={q} onChange={setQ} />
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'paused', label: 'Paused' },
              ]}
            />
          </div>
        </div>

        {/* Workflows table */}
        <div
          style={{
            overflow: 'hidden',
            marginBottom: 30,
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Workflow', 'Activity', 'Last run', 'Status', 'Runs', ''].map((h, i) => (
                  <th
                    key={i}
                    className="font-mono uppercase"
                    style={{
                      textAlign: i >= 4 ? 'right' : 'left',
                      padding: '11px 18px',
                      fontSize: 10.5,
                      fontWeight: 550,
                      letterSpacing: '0.07em',
                      color: 'var(--fg-4)',
                      borderBottom: '1px solid var(--border-2)',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((w, idx) => {
                const last = idx === rows.length - 1
                const cell: React.CSSProperties = {
                  ...td,
                  borderBottom: last ? 'none' : '1px solid var(--border-1)',
                }
                return (
                  <tr
                    key={w.id}
                    onClick={() => void navigate('/workflows/create')}
                    className="transition-colors"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={cell}>
                      <div className="flex items-center" style={{ gap: 12 }}>
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 'var(--r-btn, 8px)',
                            background: 'var(--acc-soft)',
                            color: 'var(--acc-text, var(--aurora-300))',
                          }}
                        >
                          <MS name="account_tree" size={18} />
                        </div>
                        <div className="min-w-0">
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: 'var(--fg-1)',
                              letterSpacing: '-0.012em',
                            }}
                          >
                            {w.name}
                          </div>
                          <div
                            className="truncate"
                            style={{ fontSize: 11.5, color: 'var(--fg-4)' }}
                          >
                            {w.desc}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={cell}>
                      <div style={{ width: 84 }}>
                        <SparklineChart
                          data={w.spark}
                          width={84}
                          height={26}
                          color={
                            w.status === 'paused' ? 'var(--fg-4)' : 'var(--acc, var(--aurora-400))'
                          }
                        />
                      </div>
                    </td>
                    <td
                      className="font-mono"
                      style={{ ...cell, fontSize: 12, color: 'var(--fg-3)' }}
                    >
                      {w.last}
                    </td>
                    <td style={cell}>
                      <WorkflowStatus status={w.status} />
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        ...cell,
                        textAlign: 'right',
                        fontSize: 12.5,
                        color: 'var(--fg-2)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {w.total.toLocaleString()}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      <div
                        className="flex justify-end"
                        style={{ gap: 2 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <ActionIcon
                          size={30}
                          icon={<MS name="edit" size={15} />}
                          title="Edit"
                          onClick={() => void navigate('/workflows/create')}
                        />
                        <ActionIcon
                          size={30}
                          icon={
                            <MS name={w.status === 'paused' ? 'play_arrow' : 'pause'} size={16} />
                          }
                          title={w.status === 'paused' ? 'Resume' : 'Pause'}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Recent executions feed */}
        <div className="flex items-end justify-between" style={{ marginBottom: 14 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.015em',
              color: 'var(--fg-1)',
              margin: 0,
            }}
          >
            Recent executions
          </h2>
          <button
            type="button"
            onClick={() => void navigate('/workflows/executions')}
            className="inline-flex items-center"
            style={{
              gap: 4,
              fontSize: 13,
              fontWeight: 550,
              color: 'var(--acc-text, var(--aurora-300))',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            View all
            <MS name="arrow_forward" size={15} />
          </button>
        </div>
        <div
          style={{
            overflow: 'hidden',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
          }}
        >
          {DEMO_EXECUTIONS.map((ex, i) => {
            const icon = EXEC_ICON[ex.status]
            return (
              <div
                key={ex.id}
                className="flex items-center"
                style={{
                  gap: 16,
                  padding: '13px 18px',
                  borderBottom:
                    i === DEMO_EXECUTIONS.length - 1 ? 'none' : '1px solid var(--border-1)',
                }}
              >
                <MS
                  name={icon.name}
                  size={18}
                  fill={1}
                  style={{ color: icon.color, flexShrink: 0 }}
                />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: 'var(--acc-text, var(--aurora-300))',
                    width: 84,
                    flexShrink: 0,
                  }}
                >
                  {ex.id}
                </span>
                <span
                  className="flex-1 min-w-0"
                  style={{ fontSize: 13.5, color: 'var(--fg-1)', fontWeight: 500 }}
                >
                  {ex.wf}
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: 'var(--fg-3)',
                    width: 56,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {ex.dur}
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: 12, color: 'var(--fg-5)', width: 72, textAlign: 'right' }}
                >
                  {ex.at}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
