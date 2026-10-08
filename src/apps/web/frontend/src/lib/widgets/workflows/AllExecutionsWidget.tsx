import { useNavigate } from 'react-router-dom'
import { PageHeader, Pagination } from '$components'
import HistoryTable from '$components/workflows/HistoryTable'
import ExecutionsFilterBar from '$components/workflows/ExecutionsFilterBar'
import { useExecutionsView } from '$stores/views'
import { useSettingsStore } from '$stores/settings'

export default function AllExecutionsWidget() {
  const navigate = useNavigate()
  const density = useSettingsStore(state => state.appearance.density)
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
    <div className="h-full flex flex-col bg-background">
      <PageHeader breadcrumbs={['Workflows', 'All Executions']} sticky />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
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
          <div className="glass border border-border rounded-xl overflow-hidden">
            <HistoryTable
              executions={executions}
              density={density}
              loading={false}
              onViewDetail={execution => void navigate(`/executions/${execution.id}`)}
              maxHeight="calc(100vh - 350px)"
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
