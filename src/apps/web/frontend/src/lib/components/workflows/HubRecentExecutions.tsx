import { Link } from 'react-router-dom'
import { EmptyState, MS, Card, SectionHeader } from '$components'
import { formatDuration, formatDate } from '$utils/format'
import { HUB_EXEC_ICON as EXEC_ICON } from '$lib/constants'
import type { HubRecentExecutionsProps } from '$types'

/** Recent executions feed with a "View all" link. */
export default function HubRecentExecutions({ executions, loading }: HubRecentExecutionsProps) {
  return (
    <>
      <SectionHeader
        level="section"
        className="mb-3"
        title="Recent executions"
        actions={
          <Link
            to="/workflows/executions"
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
          </Link>
        }
      />
      <Card padding="none">
        {executions.length === 0 && !loading ? (
          <EmptyState
            icon="bolt"
            title="No executions yet"
            description="Connect the supplied demo source to see execution records."
          />
        ) : (
          executions.map((ex, i) => {
            const icon = EXEC_ICON[ex.status]
            return (
              <div
                key={ex.id}
                className="flex items-center flex-wrap sm:flex-nowrap"
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
                <Link
                  to={`/executions/${ex.id}`}
                  aria-label={`View execution ${ex.id}`}
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: 'var(--acc-text, var(--aurora-300))',
                    width: 84,
                    flexShrink: 0,
                  }}
                >
                  #{ex.id}
                </Link>
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
      </Card>
    </>
  )
}
