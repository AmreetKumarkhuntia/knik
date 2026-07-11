import { useState, useEffect } from 'react'
import { workflowApi } from '$services/workflowApi'
import { HubMetricStrip, HubToolbar, HubWorkflowsTable, HubRecentExecutions } from './hub'
import type { DashboardExecution, HubWorkflowRow, WorkflowMetrics } from '$types/workflow'

/** Dashboard hub: metric strip, searchable workflows table, recent executions feed. */
export default function WorkflowHub() {
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

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 48px' }}>
        <HubMetricStrip metrics={metrics} loading={loading} />
        <HubToolbar
          shown={rows.length}
          total={workflows.length}
          query={q}
          onQueryChange={setQ}
          filter={filter}
          onFilterChange={setFilter}
        />
        <HubWorkflowsTable
          rows={rows}
          loading={loading}
          error={error}
          isEmpty={workflows.length === 0}
        />
        <HubRecentExecutions executions={executions} loading={loading} />
      </div>
    </div>
  )
}
