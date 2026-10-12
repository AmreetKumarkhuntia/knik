import type { DynamicMetric, ExecutionSnapshot } from '$types/workflow'
import { formatDuration } from './format'

/** Builds an array of metric cards for an execution detail view. */
export function calculateMetrics({ execution, timeline }: ExecutionSnapshot): DynamicMetric[] {
  const metrics: DynamicMetric[] = []

  metrics.push({
    id: 'status',
    label: 'Execution Status',
    value: execution.status.toUpperCase(),
    icon:
      execution.status === 'success'
        ? 'check_circle'
        : execution.status === 'failed'
          ? 'error'
          : 'pending',
    color:
      execution.status === 'success' ? 'teal' : execution.status === 'failed' ? 'rose' : 'blue',
  })

  if (execution.duration_ms !== undefined) {
    metrics.push({
      id: 'duration',
      label: 'Total Duration',
      value: formatDuration(execution.duration_ms),
      icon: 'schedule',
      color: 'primary',
    })
  }

  metrics.push({
    id: 'nodes',
    label: 'Nodes Executed',
    value: timeline.length,
    icon: 'account_tree',
    color: 'blue',
  })

  const successfulNodes = timeline.filter(n => n.status === 'success').length
  const successRate =
    timeline.length > 0 ? ((successfulNodes / timeline.length) * 100).toFixed(1) : '0'
  metrics.push({
    id: 'node_success_rate',
    label: 'Node Success Rate',
    value: `${successRate}%`,
    icon: 'trending_up',
    color: Number(successRate) >= 95 ? 'teal' : Number(successRate) >= 50 ? 'blue' : 'rose',
  })

  const outputSize = JSON.stringify(execution.outputs).length
  metrics.push({
    id: 'output_size',
    label: 'Output Size',
    value: formatBytes(outputSize),
    icon: 'storage',
    color: 'primary',
  })

  return metrics
}

/** Formats a byte count into a human-readable size string. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
