import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '$components/MetricCard'
import Segmented from '$components/Segmented'
import ActionIcon from '$components/ActionIcon'
import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import MS from '$components/MS'
import { workflowApi } from '$services/workflowApi'
import { formatDuration, formatDate } from '$utils/format'
import { HUB_EXEC_ICON as EXEC_ICON } from '$lib/constants'
import type { DashboardExecution, HubWorkflowRow, WorkflowMetrics } from '$types/workflow'

/** Small inline status pill (workflow active/inactive). */
function WorkflowStatus({ status }: { status: 'active' | 'inactive' }) {
  const cfg =
    status === 'active'
      ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Active' }
      : { bg: 'rgba(154,166,182,0.16)', color: 'var(--fg-3)', label: 'Inactive' }
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

  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [workflows, setWorkflows] = useState<HubWorkflowRow[]>([])
  const [executions, setExecutions] = useState<DashboardExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const [dash, metricsRes, list] = await Promise.all([
          workflowApi.analytics.getDashboard(),
          workflowApi.analytics.getMetrics('30days'),
          workflowApi.workflows.list(),
        ])
        if (cancelled) return

        // Merge workflow identity (id/name/description) with execution stats.
        const statsById = new Map(dash.data.recentWorkflows.map(w => [w.id, w]))
        const rows: HubWorkflowRow[] = list.workflows.map(w => {
          const s = statsById.get(w.id)
          return {
            id: w.id,
            name: w.name,
            description: w.description ?? '',
            totalExecutions: s?.totalExecutions ?? 0,
            status: s?.status ?? 'inactive',
            lastExecutedAt: s?.lastExecutedAt,
          }
        })

        const extra = metricsRes.metrics as Partial<WorkflowMetrics>
        setMetrics({ ...dash.data.metrics, avgDurationMs: extra.avgDurationMs })
        setWorkflows(rows)
        setExecutions(dash.data.recentExecutions)
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load workflows')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const rows = workflows.filter(
    w => (filter === 'all' || w.status === filter) && w.name.toLowerCase().includes(q.toLowerCase())
  )

  const metricCards: {
    icon: string
    label: string
    value: string | number
    color: 'primary' | 'teal' | 'rose' | 'blue'
  }[] = metrics
    ? [
        {
          icon: 'account_tree',
          label: 'Workflows',
          value: metrics.totalWorkflows,
          color: 'primary',
        },
        { icon: 'bolt', label: 'Executions today', value: metrics.executionsToday, color: 'teal' },
        {
          icon: 'check_circle',
          label: 'Success rate',
          value: `${metrics.successRate}%`,
          color: 'blue',
        },
        {
          icon: 'timer',
          label: 'Avg duration',
          value: formatDuration(metrics.avgDurationMs),
          color: 'rose',
        },
      ]
    : []

  const td: React.CSSProperties = { padding: '13px 18px' }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 48px' }}>
        {/* Metric strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14, marginBottom: 30 }}>
          {metricCards.map((m, i) => (
            <MetricCard
              key={i}
              icon={m.icon}
              label={m.label}
              value={m.value}
              color={m.color}
              loading={loading}
            />
          ))}
          {!metrics &&
            loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <MetricCard key={`s${i}`} icon="bolt" label="Loading…" value="—" loading />
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
              {rows.length} of {workflows.length} shown
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
                { value: 'inactive', label: 'Inactive' },
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
                {['Workflow', 'Last run', 'Status', 'Runs', ''].map((h, i) => (
                  <th
                    key={i}
                    className="font-mono uppercase"
                    style={{
                      textAlign: i >= 3 ? 'right' : 'left',
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
                    onClick={() => void navigate(`/workflows/${w.id}/edit`)}
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
                            style={{ fontSize: 11.5, color: 'var(--fg-4)', maxWidth: 360 }}
                          >
                            {w.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="font-mono"
                      style={{ ...cell, fontSize: 12, color: 'var(--fg-3)' }}
                    >
                      {w.lastExecutedAt ? formatDate(w.lastExecutedAt) : '—'}
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
                      {w.totalExecutions.toLocaleString()}
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
                          onClick={() => void navigate(`/workflows/${w.id}/edit`)}
                        />
                        <ActionIcon
                          size={30}
                          icon={<MS name="play_arrow" size={16} />}
                          title="Run"
                          onClick={() => void workflowApi.workflows.execute(w.id)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {loading && rows.length === 0 && <LoadingSpinner size="sm" className="py-10" />}
          {!loading && !error && workflows.length === 0 && (
            <EmptyState
              icon="account_tree"
              title="No workflows yet"
              description="Create your first workflow to see it here."
            />
          )}
          {error && (
            <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
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
          {executions.length === 0 && !loading ? (
            <EmptyState
              icon="bolt"
              title="No executions yet"
              description="Runs will appear here once your workflows execute."
            />
          ) : (
            executions.map((ex, i) => {
              const icon = EXEC_ICON[ex.status]
              return (
                <div
                  key={ex.id}
                  className="flex items-center"
                  style={{
                    gap: 16,
                    padding: '13px 18px',
                    borderBottom:
                      i === executions.length - 1 ? 'none' : '1px solid var(--border-1)',
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
                    #{ex.id}
                  </span>
                  <span
                    className="flex-1 min-w-0 truncate"
                    style={{ fontSize: 13.5, color: 'var(--fg-1)', fontWeight: 500 }}
                  >
                    {ex.workflowName}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 12,
                      color: 'var(--fg-3)',
                      width: 64,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatDuration(ex.durationMs)}
                  </span>
                  <span
                    className="font-mono"
                    style={{ fontSize: 12, color: 'var(--fg-5)', width: 150, textAlign: 'right' }}
                  >
                    {formatDate(ex.startedAt)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
