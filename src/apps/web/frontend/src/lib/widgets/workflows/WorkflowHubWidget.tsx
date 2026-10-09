import { Link, useNavigate } from 'react-router-dom'
import { Banner, Input, MS, Segmented, SectionHeader } from '$components'
import HubMetricStrip from '$components/workflows/HubMetricStrip'
import HubRecentExecutions from '$components/workflows/HubRecentExecutions'
import HubWorkflowsTable from '$components/workflows/HubWorkflowsTable'
import { useWorkflowHubView } from '$stores/views'
import { useFeedbackStore } from '$stores/feedback'
import { ROUTE_PATHS, ROUTES } from '$lib/constants/navigation'

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
  const addToast = useFeedbackStore(state => state.addToast)
  const navigate = useNavigate()
  const handleRun = (id: string) => {
    const result = runWorkflow(id)
    if (!result.ok) addToast(result.error, 'info')
    else if (result.id !== undefined) void navigate(ROUTE_PATHS.executionDetail(result.id))
  }
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 pb-8">
        <SectionHeader
          title="Workflows"
          subtitle={`${rows.length} of ${count} shown`}
          actions={
            <Link
              to={ROUTES.builder}
              className="inline-flex min-h-9 max-sm:min-h-11 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-[var(--on-primary)] whitespace-nowrap"
            >
              <MS name="add" size={16} />
              New workflow
            </Link>
          }
        />
        <HubMetricStrip metrics={metrics} loading={false} />
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            fullWidth={false}
            aria-label="Search workflows"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search workflows…"
            className="!px-3 !py-2 sm:max-w-72"
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
        </div>
        {count > 0 && (
          <Banner variant="info">
            Runs use supplied demo scenarios. Workflows without a scenario cannot run.
          </Banner>
        )}
        <HubWorkflowsTable
          rows={rows}
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
