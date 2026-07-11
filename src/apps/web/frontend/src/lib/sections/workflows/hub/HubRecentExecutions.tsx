import { useNavigate } from 'react-router-dom'
import { EmptyState, MS } from '$components'
import { PaneHeader, SurfaceCard } from '$widgets'
import { formatDuration, formatDate } from '$utils/format'
import { HUB_EXEC_ICON as EXEC_ICON } from '$lib/constants'
import type { HubRecentExecutionsProps } from '$types'

/** Recent executions feed with a "View all" link. */
export default function HubRecentExecutions({ executions, loading }: HubRecentExecutionsProps) {
  const navigate = useNavigate()
  return (
    <>
      <PaneHeader
        title="Recent executions"
        right={
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
        }
      />
      <SurfaceCard>
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
                  borderBottom: i === executions.length - 1 ? 'none' : '1px solid var(--border-1)',
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
      </SurfaceCard>
    </>
  )
}
