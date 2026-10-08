import { Link, useNavigate } from 'react-router-dom'
import { Banner, Input, MS, Segmented, SectionHeader } from '$components'
import HubMetricStrip from '$components/workflows/HubMetricStrip'
import HubRecentExecutions from '$components/workflows/HubRecentExecutions'
import HubWorkflowsTable from '$components/workflows/HubWorkflowsTable'
import { useWorkflowHubView } from '$stores/views'
import { useSettingsStore } from '$stores/settings'
import { useFeedbackStore } from '$stores/feedback'

export default function WorkflowHubWidget() {
  const {
    filter,
    query,
    setFilter,
    setQuery,
    metrics,
    rows,
    recentExecutions,
    count,
    canRun,
    runWorkflow,
  } = useWorkflowHubView()
  const density = useSettingsStore(state => state.appearance.density)
  const addToast = useFeedbackStore(state => state.addToast)
  const navigate = useNavigate()

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
          subtitle={`${rows.length} of ${count} shown`}
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
        {count > 0 && (
          <Banner variant="info">
            Runs use supplied demo scenarios. Workflows without a scenario cannot run.
          </Banner>
        )}
        <HubWorkflowsTable
          rows={rows}
          density={density}
          loading={false}
          error={null}
          isEmpty={count === 0}
          onRun={handleRun}
          canRun={canRun}
        />
        <HubRecentExecutions executions={recentExecutions} loading={false} />
      </div>
    </div>
  )
}
