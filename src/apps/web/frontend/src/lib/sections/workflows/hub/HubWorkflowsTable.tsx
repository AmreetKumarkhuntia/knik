import { useNavigate } from 'react-router-dom'
import { ActionIcon, LoadingSpinner, EmptyState, MS } from '$components'
import { StatusPill, SurfaceCard, IconTile } from '$widgets'
import { workflowApi } from '$services/workflowApi'
import { formatDate } from '$utils/format'
import type { HubWorkflowsTableProps } from '$types'

/** Workflows table: status pills, run counts, and per-row edit/run actions. */
export default function HubWorkflowsTable({
  rows,
  loading,
  error,
  isEmpty,
}: HubWorkflowsTableProps) {
  const navigate = useNavigate()
  const td: React.CSSProperties = { padding: '13px 18px' }

  return (
    <SurfaceCard style={{ marginBottom: 30 }}>
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
                    <IconTile
                      bg="var(--acc-soft)"
                      color="var(--acc-text, var(--aurora-300))"
                      icon={<MS name="account_tree" size={18} />}
                    />
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
                <td className="font-mono" style={{ ...cell, fontSize: 12, color: 'var(--fg-3)' }}>
                  {w.lastExecutedAt ? formatDate(w.lastExecutedAt) : '—'}
                </td>
                <td style={cell}>
                  <StatusPill
                    tone={w.status === 'active' ? 'success' : 'neutral'}
                    label={w.status === 'active' ? 'Active' : 'Inactive'}
                  />
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
      {!loading && !error && isEmpty && (
        <EmptyState
          icon="account_tree"
          title="No workflows yet"
          description="Create your first workflow to see it here."
        />
      )}
      {error && (
        <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--danger)' }}>{error}</div>
      )}
    </SurfaceCard>
  )
}
