import { Link, useNavigate } from 'react-router-dom'
import { MS, Pagination, SectionHeader } from '$components'
import HistoryTable from '$components/workflows/HistoryTable'
import ExecutionsFilterBar from '$components/workflows/ExecutionsFilterBar'
import { useExecutionsView } from '$stores/views'
import { ROUTE_PATHS, ROUTES } from '$lib/constants/navigation'

export default function AllExecutionsWidget() {
  const navigate = useNavigate()
  const {
    workflows,
    selectedWorkflow,
    selectedStatus,
    setWorkflow,
    setStatus,
    clear,
    hasActiveFilters,
    executions,
    totalCount,
    totalPages,
    currentPage,
    setPage,
  } = useExecutionsView()
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
        <SectionHeader
          className="mb-2"
          title="Executions"
          subtitle="Workflow run history"
          actions={
            <Link
              to={ROUTES.workflows}
              className="knik-btn knik-btn--secondary knik-btn--sm knik-focus rounded-[11px] pl-2.5 pr-3.5 whitespace-nowrap"
            >
              <MS name="arrow_back" size={18} />
              Workflows
            </Link>
          }
        />
        <ExecutionsFilterBar
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          selectedStatus={selectedStatus}
          onWorkflowChange={setWorkflow}
          onStatusChange={setStatus}
          onClearFilters={clear}
          hasActiveFilters={hasActiveFilters}
          shownCount={executions.length}
          totalCount={totalCount}
        />
        <div>
          <HistoryTable
            executions={executions}
            onViewDetail={execution => void navigate(ROUTE_PATHS.executionDetail(execution.id))}
            maxHeight="none"
          />
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  )
}
