import type { DynamicMetric, ExecutionDetailResponse } from '$types/workflow'

export function calculateMetrics(data: ExecutionDetailResponse | null): DynamicMetric[] {
  if (!data) return []

  const { execution, timeline } = data

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
  } else if (execution.status === 'running') {
    const startTime = new Date(execution.started_at).getTime()
    const now = Date.now()
    const elapsed = now - startTime
    metrics.push({
      id: 'duration',
      label: 'Elapsed Time',
      value: formatDuration(elapsed),
      icon: 'schedule',
      color: 'blue',
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

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
