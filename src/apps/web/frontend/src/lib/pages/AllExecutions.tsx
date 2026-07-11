import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HistoryTable from '$lib/sections/workflows/ExecutionHistory/HistoryTable'
import ExecutionsFilterBar from '$sections/workflows/executions/ExecutionsFilterBar'
import { PageHeader, Pagination } from '$components'
import { FullScreenLoader, FullScreenError } from '$widgets'
import type { DashboardExecution } from '$types/workflow'
import { workflowApi } from '$services/workflowApi'

/** Paginated list of all executions with workflow and status filters. */
export default function AllExecutions() {
  const navigate = useNavigate()

  const [executions, setExecutions] = useState<DashboardExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalExecutions, setTotalExecutions] = useState(0)
  const pageSize = 50

  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const response = await workflowApi.analytics.getWorkflowsList()
        setWorkflows(response.workflows)
      } catch (err) {
        console.error('Failed to fetch workflows list:', err)
      }
    }
    void fetchWorkflows()
  }, [])

  useEffect(() => {
    async function fetchExecutions() {
      try {
        setLoading(true)
        setError(null)

        const response = await workflowApi.analytics.getExecutionsPaginated(
          page,
          pageSize,
          selectedWorkflow || undefined,
          selectedStatus !== 'all' ? selectedStatus : undefined
        )

        setExecutions(response.data.executions)
        setTotalPages(response.data.total_pages)
        setTotalExecutions(response.data.total)
      } catch (err) {
        console.error('Failed to fetch executions:', err)
        setError('Failed to load executions')
      } finally {
        setLoading(false)
      }
    }

    void fetchExecutions()
  }, [page, selectedWorkflow, selectedStatus])

  const handleViewExecution = (execution: DashboardExecution) => {
    void navigate(`/executions/${execution.id}`)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearFilters = () => {
    setSelectedWorkflow('')
    setSelectedStatus('all')
    setPage(1)
  }

  const hasActiveFilters = selectedWorkflow !== '' || selectedStatus !== 'all'

  if (error) {
    return <FullScreenError layout="fill" message={error} />
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <PageHeader breadcrumbs={['Workflows', 'All Executions']} sticky={true} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <ExecutionsFilterBar
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            selectedStatus={selectedStatus}
            onWorkflowChange={v => {
              setSelectedWorkflow(v)
              setPage(1)
            }}
            onStatusChange={v => {
              setSelectedStatus(v)
              setPage(1)
            }}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            loading={loading}
            shownCount={executions.length}
            totalCount={totalExecutions}
          />

          {loading && page === 1 ? (
            <FullScreenLoader variant="block" />
          ) : (
            <div className="glass border border-border rounded-xl overflow-hidden">
              <HistoryTable
                executions={executions}
                loading={loading}
                onViewDetail={handleViewExecution}
                maxHeight="calc(100vh - 350px)"
              />

              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  disabled={loading}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
