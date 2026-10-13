import { formatDuration } from '$utils/format'
import type { HubMetricStripProps } from '$types'

export default function HubMetricStrip({ metrics }: HubMetricStripProps) {
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
    <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4 mb-3 border-b border-border-1">
      {items.map((item, index) => (
        <div
          key={item.label}
          className="flex items-baseline gap-2 knik-enter-rise"
          style={{ animationDelay: `${index * 0.06}s` }}
        >
          <dt className="text-body text-fg-3">{item.label}</dt>
          <dd className="text-body-lg leading-none font-semibold text-fg-1 tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
