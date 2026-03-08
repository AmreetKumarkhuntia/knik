import { useCallback, useMemo, useState } from 'react'
import type {
  ExecutionRecord,
  Schedule,
  ScheduleCreateRequest,
  WorkflowDefinition,
} from '$types/workflow'
import type { TabType } from '$types/workflow-components'
import { workflowApi } from '$services/workflowApi'
import ActionButton from '$components/ActionButton'
import ConfirmDialog from '$components/ConfirmDialog'
import Tabs from '$components/Tabs'
import { ScheduleList, ScheduleForm } from './ScheduleManager'
import { HistoryTable, ExecutionDetail } from './ExecutionHistory'
import { Canvas } from './WorkflowBuilder'
import WorkflowHeader from './WorkflowHeader'
import WorkflowStats from './WorkflowStats'
import EnhancedEmptyState from '$components/EnhancedEmptyState'

export default function WorkflowDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('schedules')
  const [selectedWorkflowId] = useState<string | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [workflowDefinition] = useState<WorkflowDefinition | undefined>()

  // Temporary placeholders until hooks are implemented
  const [workflows] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [schedules] = useState<Schedule[]>([])
  const [executions] = useState<ExecutionRecord[]>([])
  const schedulesLoading = false
  const executionsLoading = false

  const workflowNames = useMemo(
    () =>
      Object.fromEntries(
        workflows.map((w: { id: string; name: string; description?: string }) => [w.id, w.name])
      ),
    [workflows]
  )

  const toggleSchedule = useCallback(async (id: number, enabled: boolean) => {
    console.log('Toggle schedule:', id, enabled)
  }, [])

  const deleteSchedule = useCallback(async (id: number) => {
    console.log('Delete schedule:', id)
  }, [])

  const handleToggleSchedule = useCallback(
    async (id: number, enabled: boolean) => {
      try {
        await toggleSchedule(id, enabled)
      } catch (error) {
        console.error('Failed to toggle schedule:', error)
      }
    },
    [toggleSchedule]
  )

  const handleDeleteSchedule = useCallback(async () => {
    if (deleteConfirmId === null) return
    try {
      await deleteSchedule(deleteConfirmId)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }, [deleteConfirmId, deleteSchedule])

  const handleRunWorkflow = useCallback(async (workflowId: string) => {
    try {
      setIsExecuting(true)
      await workflowApi.workflows.execute(workflowId)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    } finally {
      setIsExecuting(false)
    }
  }, [])

  const handleCreateSchedule = useCallback(async (data: ScheduleCreateRequest) => {
    try {
      await workflowApi.schedules.create(data)
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }, [])

  const handleViewExecution = useCallback((execution: ExecutionRecord) => {
    setSelectedExecution(execution)
  }, [])

  const handleSaveWorkflow = useCallback(
    (definition: WorkflowDefinition) => {
      console.log('Save workflow:', selectedWorkflowId, definition)
    },
    [selectedWorkflowId]
  )

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'schedules', label: 'Schedules', icon: '📅' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'builder', label: 'Builder', icon: '🔧' },
  ]

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="max-w-7xl mx-auto flex flex-col">
        <header className="mb-8">
          <WorkflowHeader />
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="underline" />
        </header>

        <main className="flex-1 pb-40">
          {activeTab === 'schedules' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Active Schedules</h2>
                <p className="text-textSecondary text-sm">
                  {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
                </p>
              </div>
              {schedules.length === 0 ? (
                <EnhancedEmptyState
                  title="No schedules yet"
                  description="Create a schedule to automate workflow execution and run your workflows on a timer."
                  actionLabel="Create Schedule"
                  secondaryActionLabel="Learn More"
                />
              ) : (
                <ScheduleList
                  schedules={schedules}
                  loading={schedulesLoading}
                  workflowNames={workflowNames}
                  onToggle={(id, enabled) => void handleToggleSchedule(id, enabled)}
                  onEdit={schedule => {
                    setEditingSchedule(schedule)
                    setShowScheduleForm(true)
                  }}
                  onDelete={id => setDeleteConfirmId(id)}
                  onRun={workflowId => void handleRunWorkflow(workflowId)}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Execution History</h2>
                <p className="text-textSecondary text-sm">
                  Select a schedule and run it to see execution history
                </p>
              </div>
              {executions.length === 0 ? (
                <EnhancedEmptyState
                  title="No executions yet"
                  description="Run your workflow to see execution history and detailed performance metrics."
                  actionLabel="Run Workflow"
                  secondaryActionLabel="Learn More"
                />
              ) : (
                <HistoryTable
                  executions={executions}
                  loading={executionsLoading}
                  onViewDetail={handleViewExecution}
                  onRetry={exec => void handleRunWorkflow(exec.workflow_id)}
                />
              )}
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="h-[600px]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Workflow Builder</h2>
                  <p className="text-textSecondary text-sm">
                    {selectedWorkflowId
                      ? `Editing: ${workflowNames[selectedWorkflowId] || selectedWorkflowId}`
                      : 'Create a new workflow'}
                  </p>
                </div>
                {selectedWorkflowId && (
                  <ActionButton
                    icon="▶"
                    label={isExecuting ? 'Running...' : 'Execute'}
                    variant="primary"
                    loading={isExecuting}
                    onClick={() => void handleRunWorkflow(selectedWorkflowId)}
                  />
                )}
              </div>
              {!selectedWorkflowId ? (
                <EnhancedEmptyState
                  title="No workflow selected"
                  description="Select an existing workflow or create a new one to start building your automation."
                  actionLabel="Create New Workflow"
                  secondaryActionLabel="Learn More"
                />
              ) : (
                <Canvas
                  workflowId={selectedWorkflowId}
                  definition={workflowDefinition}
                  onSave={handleSaveWorkflow}
                  onExecute={
                    selectedWorkflowId
                      ? () => void handleRunWorkflow(selectedWorkflowId)
                      : undefined
                  }
                />
              )}
            </div>
          )}
        </main>
      </div>

      <WorkflowStats />

      <ScheduleForm
        isOpen={showScheduleForm}
        onClose={() => {
          setShowScheduleForm(false)
          setEditingSchedule(null)
        }}
        onSubmit={data => handleCreateSchedule(data)}
        workflows={workflows}
        initialData={editingSchedule || undefined}
      />

      <ExecutionDetail
        execution={selectedExecution}
        isOpen={selectedExecution !== null}
        onClose={() => setSelectedExecution(null)}
      />

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          void handleDeleteSchedule()
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  )
}
