import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Pagination } from '$components'
import HistoryTable from '$components/workflows/HistoryTable'
import ExecutionsFilterBar from '$components/workflows/ExecutionsFilterBar'
import { useDemoSession } from '$widgets/session/useDemoSession'
import { toExecutionSummary } from './selectors'

export default function AllExecutionsWidget() {
  const navigate = useNavigate()
  const density = useDemoSession(state => state.appearance.density)
  const allExecutions = useDemoSession(state => state.executions)
  const workflows = useDemoSession(state => state.workflows)
  const [page, setPage] = useState(1)
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const filtered = allExecutions
    .filter(
      execution =>
        (!selectedWorkflow || execution.workflow_id === selectedWorkflow) &&
        (selectedStatus === 'all' || execution.status === selectedStatus)
    )
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
  const totalPages = Math.max(1, Math.ceil(filtered.length / 50))
  const currentPage = Math.min(page, totalPages)
  const executions = filtered
    .slice((currentPage - 1) * 50, currentPage * 50)
    .map(toExecutionSummary)
  return (
    <div className="h-full flex flex-col bg-background">
      <PageHeader breadcrumbs={['Workflows', 'All Executions']} sticky />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <ExecutionsFilterBar
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            selectedStatus={selectedStatus}
            onWorkflowChange={value => {
              setSelectedWorkflow(value)
              setPage(1)
            }}
            onStatusChange={value => {
              setSelectedStatus(value)
              setPage(1)
            }}
            onClearFilters={() => {
              setSelectedWorkflow('')
              setSelectedStatus('all')
              setPage(1)
            }}
            hasActiveFilters={selectedWorkflow !== '' || selectedStatus !== 'all'}
            loading={false}
            shownCount={executions.length}
            totalCount={filtered.length}
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
