import { useCallback, useMemo, useState } from 'react'
import type {
  ExecutionRecord,
  Schedule,
  ScheduleCreateRequest,
  WorkflowDefinition,
} from '$types/workflow'
import type { TabType } from '$types/workflow-components'
import { workflowApi } from '$services/workflowApi'
import { ActionButton, ConfirmDialog, LoadingSpinner } from '$common'
import { ScheduleList, ScheduleForm } from './ScheduleManager'
import { HistoryTable, ExecutionDetail } from './ExecutionHistory'
import { Canvas } from './WorkflowBuilder'
import { useWorkflows, useSchedules, useExecutions, useRealtimeStatus } from './hooks'

export default function WorkflowDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('schedules')
  const [selectedWorkflowId] = useState<string | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [workflowDefinition] = useState<WorkflowDefinition | undefined>()

  const { workflows, loading: workflowsLoading, refetch: refetchWorkflows } = useWorkflows()
  const {
    schedules,
    loading: schedulesLoading,
    refetch: refetchSchedules,
    toggleSchedule,
    deleteSchedule,
  } = useSchedules()
  const {
    executions,
    loading: executionsLoading,
    refetch: refetchExecutions,
  } = useExecutions(selectedWorkflowId)

  const workflowNames = useMemo(
    () => Object.fromEntries(workflows.map(w => [w.id, w.name])),
    [workflows]
  )

  const handleRefresh = useCallback(() => {
    void refetchWorkflows()
    void refetchSchedules()
    void refetchExecutions()
  }, [refetchWorkflows, refetchSchedules, refetchExecutions])

  useRealtimeStatus(handleRefresh, 10000)

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

  const handleRunWorkflow = useCallback(
    async (workflowId: string) => {
      try {
        setIsExecuting(true)
        await workflowApi.workflows.execute(workflowId)
        void refetchExecutions()
      } catch (error) {
        console.error('Failed to execute workflow:', error)
      } finally {
        setIsExecuting(false)
      }
    },
    [refetchExecutions]
  )

  const handleCreateSchedule = useCallback(
    async (data: ScheduleCreateRequest) => {
      try {
        await workflowApi.schedules.create(data)
        void refetchSchedules()
      } catch (error) {
        console.error('Failed to create schedule:', error)
      }
    },
    [refetchSchedules]
  )

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

  if (workflowsLoading && schedulesLoading) {
    return <LoadingSpinner size="lg" className="h-screen" />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Workflow Dashboard</h1>
              <p className="text-white/60 mt-1">
                Manage cron jobs, view execution history, and build workflows
              </p>
            </div>
            <div className="flex gap-3">
              <ActionButton
                icon="↻"
                label="Refresh"
                variant="ghost"
                onClick={() => void handleRefresh()}
              />
              <ActionButton
                icon="+"
                label="New Schedule"
                variant="primary"
                onClick={() => setShowScheduleForm(true)}
              />
            </div>
          </div>

          <nav className="flex border-b border-white/10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-white bg-white/5'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {activeTab === 'schedules' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Active Schedules</h2>
                <p className="text-white/50 text-sm">
                  {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
                </p>
              </div>
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
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Execution History</h2>
                <p className="text-white/50 text-sm">
                  Select a schedule and run it to see execution history
                </p>
              </div>
              <HistoryTable
                executions={executions}
                loading={executionsLoading}
                onViewDetail={handleViewExecution}
                onRetry={exec => void handleRunWorkflow(exec.workflow_id)}
              />
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="h-[600px]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Workflow Builder</h2>
                  <p className="text-white/50 text-sm">
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
              <Canvas
                workflowId={selectedWorkflowId || undefined}
                definition={workflowDefinition}
                onSave={handleSaveWorkflow}
                onExecute={
                  selectedWorkflowId ? () => void handleRunWorkflow(selectedWorkflowId) : undefined
                }
              />
            </div>
          )}
        </main>
      </div>

      <ScheduleForm
        isOpen={showScheduleForm}
        onClose={() => {
          setShowScheduleForm(false)
          setEditingSchedule(null)
        }}
        onSubmit={data => void handleCreateSchedule(data)}
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
        onConfirm={handleDeleteSchedule}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  )
}
