import { formatDuration } from '$utils/format'
import type { HubMetricStripProps } from '$types'

export default function HubMetricStrip({ metrics, loading }: HubMetricStripProps) {
  const items = [
    { label: 'Workflows', value: metrics?.totalWorkflows ?? '—' },
    { label: 'Executions today', value: metrics?.executionsToday ?? '—' },
    {
      label: 'Success rate',
      value: metrics && (metrics.totalExecutions ?? 0) > 0 ? `${metrics.successRate}%` : '—',
    },
    { label: 'Avg duration', value: metrics ? formatDuration(metrics.avgDurationMs) : '—' },
  ]
  return (
    <dl
      className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4 mb-3 border-b border-border"
      aria-busy={loading}
    >
      {items.map(item => (
        <div key={item.label} className="flex items-baseline gap-2">
          <dt className="text-sm text-secondary">{item.label}</dt>
          <dd className="text-sm font-semibold tabular-nums text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
