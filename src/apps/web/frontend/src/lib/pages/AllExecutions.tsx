import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '$lib/components/PageHeader'
import HistoryTable from '$lib/sections/workflows/ExecutionHistory/HistoryTable'
import Pagination from '$lib/components/Pagination'
import LoadingSpinner from '$lib/components/LoadingSpinner'
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
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-error text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <PageHeader breadcrumbs={['Workflows', 'All Executions']} sticky={true} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="glass border border-border rounded-xl p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="workflow-filter" className="text-sm font-medium text-subtle">
                  Workflow:
                </label>
                <select
                  id="workflow-filter"
                  value={selectedWorkflow}
                  onChange={e => {
                    setSelectedWorkflow(e.target.value)
                    setPage(1)
                  }}
                  className="px-3 py-1.5 text-sm bg-surfaceRaised border border-border rounded-lg text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Workflows</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="status-filter" className="text-sm font-medium text-subtle">
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={e => {
                    setSelectedStatus(e.target.value)
                    setPage(1)
                  }}
                  className="px-3 py-1.5 text-sm bg-surfaceRaised border border-border rounded-lg text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="running">Running</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 text-sm font-medium text-subtle hover:text-foreground border border-border rounded-lg hover:bg-surface transition-all"
                >
                  Clear Filters
                </button>
              )}

              <div className="ml-auto text-sm text-secondary">
                {loading ? (
                  <span>Loading...</span>
                ) : (
                  <span>
                    Showing{' '}
                    <span className="font-semibold text-foreground">{executions.length}</span> of{' '}
                    <span className="font-semibold text-foreground">{totalExecutions}</span>{' '}
                    executions
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
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
