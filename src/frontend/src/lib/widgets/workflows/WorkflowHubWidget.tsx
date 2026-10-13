import { Link, useNavigate } from 'react-router-dom'
import { Banner, Input, MS, Segmented, SectionHeader } from '$components'
import HubMetricStrip from '$components/workflows/HubMetricStrip'
import HistoryTable from '$components/workflows/HistoryTable'
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
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
        <SectionHeader
          className="mb-2"
          title="Workflows"
          subtitle={`${rows.length} of ${count} shown`}
          actions={
            <Link
              to={ROUTES.builder}
              className="knik-btn knik-btn--primary knik-btn--sm knik-focus rounded-[11px] pl-2.5 pr-3.5 whitespace-nowrap"
            >
              <MS name="add" size={18} />
              New workflow
            </Link>
          }
        />
        <HubMetricStrip metrics={metrics} />
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <MS
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4 pointer-events-none"
            />
            <Input
              aria-label="Search workflows"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search workflows…"
              className="pl-9 rounded-[11px]"
            />
          </div>
          <Segmented
            label="Filter workflows"
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
        <HubWorkflowsTable rows={rows} isEmpty={count === 0} onRun={handleRun} canRun={canRun} />
        <SectionHeader
          level="section"
          className="mb-3 items-center"
          title="Recent executions"
          actions={
            <Link
              to={ROUTES.executions}
              className="inline-flex items-center gap-1 hover:gap-2 px-2 py-1.5 rounded-[9px] text-label text-[var(--acc-text)] hover:bg-[var(--acc-soft)] transition-all duration-base ease-out knik-focus"
            >
              View all
              <MS name="arrow_forward" size={16} />
            </Link>
          }
        />
        <HistoryTable
          executions={recentExecutions}
          onViewDetail={execution => void navigate(ROUTE_PATHS.executionDetail(execution.id))}
        />
      </div>
    </div>
  )
}
