import { useNavigate } from 'react-router-dom'
import { Pagination, SectionHeader } from '$components'
import HistoryTable from '$components/workflows/HistoryTable'
import ExecutionsFilterBar from '$components/workflows/ExecutionsFilterBar'
import { useExecutionsView } from '$stores/views'
import { ROUTE_PATHS } from '$lib/constants/navigation'

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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <SectionHeader title="Executions" subtitle="Workflow run history" />
        <ExecutionsFilterBar
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          selectedStatus={selectedStatus}
          onWorkflowChange={setWorkflow}
          onStatusChange={setStatus}
          onClearFilters={clear}
          hasActiveFilters={hasActiveFilters}
          loading={false}
          shownCount={executions.length}
          totalCount={totalCount}
        />
        <div>
          <HistoryTable
            executions={executions}
            loading={false}
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
