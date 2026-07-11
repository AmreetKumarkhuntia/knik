import { MetricCard } from '$components'
import { formatDuration } from '$utils/format'
import type { HubMetricStripProps } from '$types'

/** Four-up metric strip for the workflow hub. */
export default function HubMetricStrip({ metrics, loading }: HubMetricStripProps) {
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

  return (
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
  )
}
