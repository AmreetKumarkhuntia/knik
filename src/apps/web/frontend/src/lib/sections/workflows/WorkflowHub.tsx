import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UI_TEXT } from '$lib/constants'
import PageHeader from '$components/PageHeader'
import ConfirmDialog from '$components/ConfirmDialog'
import MetricCard from '$components/MetricCard'
import SectionHeader from '$components/SectionHeader'
import type { DashboardResponse, DashboardExecution } from '$types/workflow'
import { workflowApi } from '$services/workflowApi'
import WorkflowsTable from './WorkflowsTable'
import HistoryTable from './ExecutionHistory/HistoryTable'

export default function WorkflowHub() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    workflowId: string | null
    workflowName: string
  }>({ isOpen: false, workflowId: null, workflowName: '' })

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await workflowApi.analytics.getDashboard(20, 100)
        setDashboard(data)
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchDashboard()
  }, [])

  const handleEditWorkflow = (workflowId: string) => {
    void navigate(`/workflows/${workflowId}/edit`)
  }

  const handleDeleteClick = (workflowId: string, workflowName: string) => {
    setDeleteDialog({ isOpen: true, workflowId, workflowName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.workflowId) return

    setDeleting(true)
    try {
      await workflowApi.workflows.delete(deleteDialog.workflowId)
      setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' })
      const data = await workflowApi.analytics.getDashboard(20, 100)
      setDashboard(data)
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' })
  }

  const handleViewExecution = (execution: DashboardExecution) => {
    void navigate(`/executions/${execution.id}`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="animate-spin inline-block w-8 h-8 border-2 border-border-t-text rounded-full" />
      </div>
    )
  }

  return (
    <main className="flex-1 bg-transparent flex flex-col">
      <PageHeader
        breadcrumbs={['Workflows', 'Workflow Hub']}
        rightContent={
          <button
            onClick={() => void navigate('/workflows/create')}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/30 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            {UI_TEXT.workflow.create}
          </button>
        }
        sticky={true}
      />

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            icon="account_tree"
            label={UI_TEXT.workflow.metrics.total}
            value={dashboard?.data.metrics.totalWorkflows ?? 0}
            trend={{ direction: 'up', value: '+12%', icon: 'trending_up' }}
            color="primary"
          />
          <MetricCard
            icon="bolt"
            label={UI_TEXT.workflow.metrics.executionsToday}
            value={dashboard?.data.metrics.executionsToday.toLocaleString() || 0}
            trend={{ direction: 'up', value: '+5.2%', icon: 'trending_up' }}
            color="primary"
          />
          <MetricCard
            icon="check_circle"
            label={UI_TEXT.workflow.metrics.successRate}
            value={`${dashboard?.data.metrics.successRate ?? 0}%`}
            trend={{ direction: 'neutral', value: 'Steady' }}
            color="teal"
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="flex flex-col gap-4">
            <SectionHeader
              title={UI_TEXT.workflow.sections.workflows}
              actionText={UI_TEXT.workflow.buttons.viewAll}
              onActionClick={() => void navigate('/workflows')}
            />
            <WorkflowsTable
              workflows={dashboard?.data.recentWorkflows || []}
              onEdit={handleEditWorkflow}
              onDelete={handleDeleteClick}
            />
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeader
              title={UI_TEXT.workflow.sections.recentExecutions}
              actionText={UI_TEXT.workflow.buttons.viewAll}
              onActionClick={() => void navigate('/workflows/executions')}
            />
            <HistoryTable
              executions={dashboard?.data.recentExecutions || []}
              loading={false}
              onViewDetail={handleViewExecution}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={UI_TEXT.workflow.delete.title}
        message={`Are you sure you want to delete "${deleteDialog.workflowName}"? This action cannot be undone.`}
        confirmLabel={UI_TEXT.workflow.delete.confirmLabel}
        cancelLabel={UI_TEXT.workflow.delete.cancelLabel}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </main>
  )
}
