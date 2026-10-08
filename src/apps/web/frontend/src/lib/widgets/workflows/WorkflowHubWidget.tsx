import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banner, Input, MS, Segmented, SectionHeader } from '$components'
import HubMetricStrip from '$components/workflows/HubMetricStrip'
import HubRecentExecutions from '$components/workflows/HubRecentExecutions'
import HubWorkflowsTable from '$components/workflows/HubWorkflowsTable'
import { useDemoSession } from '$widgets/session/useDemoSession'
import type { HubWorkflowRow, WorkflowMetrics } from '$types/workflow'
import { toExecutionSummary } from './selectors'

export default function WorkflowHubWidget() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const density = useDemoSession(state => state.appearance.density)
  const workflows = useDemoSession(state => state.workflows)
  const executions = useDemoSession(state => state.executions)
  const schedules = useDemoSession(state => state.schedules)
  const scenarios = useDemoSession(state => state.runScenarios)
  const runWorkflow = useDemoSession(state => state.runWorkflow)
  const addToast = useDemoSession(state => state.addToast)
  const navigate = useNavigate()
  const today = new Date().toDateString()
  const durations = executions.flatMap(execution =>
    execution.duration_ms === undefined ? [] : [execution.duration_ms]
  )
  const metrics: WorkflowMetrics = {
    totalWorkflows: workflows.length,
    totalExecutions: executions.length,
    executionsToday: executions.filter(
      execution => new Date(execution.started_at).toDateString() === today
    ).length,
    successRate: executions.length
      ? Math.round(
          (executions.filter(execution => execution.status === 'success').length /
            executions.length) *
            100
        )
      : 0,
    avgDurationMs: durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : undefined,
  }
  const rows: HubWorkflowRow[] = workflows
    .map<HubWorkflowRow>(workflow => {
      const runs = executions.filter(execution => execution.workflow_id === workflow.id)
      const latest = [...runs].sort((a, b) => b.started_at.localeCompare(a.started_at)).at(0)
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description ?? '',
        totalExecutions: runs.length,
        status: schedules.some(
          schedule => schedule.target_workflow_id === workflow.id && schedule.enabled
        )
          ? 'active'
          : 'inactive',
        lastExecutedAt: latest?.started_at,
      }
    })
    .filter(
      workflow =>
        (filter === 'all' || workflow.status === filter) &&
        workflow.name.toLowerCase().includes(query.toLowerCase())
    )

  const handleRun = (id: string) => {
    const result = runWorkflow(id)
    if (!result.ok) addToast(result.error, 'info')
    else if (result.id !== undefined) void navigate(`/executions/${result.id}`)
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-7xl mx-auto w-full px-4 py-7 sm:px-8 pb-12">
        <HubMetricStrip metrics={metrics} loading={false} />
        <SectionHeader
          title="Workflows"
          subtitle={`${rows.length} of ${workflows.length} shown`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Input
                aria-label="Search workflows"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search workflows…"
                className="!px-3 !py-2"
              />
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
              <Link
                to="/workflows/create"
                className="inline-flex items-center gap-1 text-sm text-primary whitespace-nowrap"
              >
                <MS name="add" size={16} />
                New workflow
              </Link>
            </div>
          }
        />
        {workflows.length > 0 && (
          <Banner variant="info">
            Runs use supplied demo scenarios. Workflows without a scenario cannot run.
          </Banner>
        )}
        <HubWorkflowsTable
          rows={rows}
          density={density}
          loading={false}
          error={null}
          isEmpty={workflows.length === 0}
          onRun={handleRun}
          canRun={id => Object.hasOwn(scenarios, id)}
        />
        <HubRecentExecutions
          executions={[...executions]
            .sort((a, b) => b.started_at.localeCompare(a.started_at))
            .slice(0, 5)
            .map(toExecutionSummary)}
          loading={false}
        />
      </div>
    </div>
  )
}
