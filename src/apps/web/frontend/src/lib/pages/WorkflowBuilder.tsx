import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '$components/PageHeader'
import Canvas from '$sections/workflows/WorkflowBuilder/Canvas'
import type { WorkflowDefinition } from '$types/workflow'
import { workflowApi } from '$services/workflowApi'

export default function WorkflowBuilder() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [workflowData, setWorkflowData] = useState<WorkflowDefinition | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const isEditMode = !!id
  const pageTitle = isEditMode ? 'Edit Workflow' : 'Create Workflow'

  useEffect(() => {
    if (id) {
      void loadWorkflow(id)
    }
  }, [id])

  const loadWorkflow = async (workflowId: string) => {
    try {
      setIsLoading(true)
      const response = await workflowApi.workflows.get(workflowId)
      setWorkflowData(response.workflow)
    } catch (error) {
      console.error('Failed to load workflow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (definition: WorkflowDefinition) => {
    try {
      if (id) {
        await workflowApi.workflows.update(id, pageTitle, definition)
      } else {
        const workflowName = `Workflow ${new Date().toLocaleDateString()}`
        await workflowApi.workflows.create(workflowName, definition)
      }
      void navigate('/workflows')
    } catch (error) {
      console.error('Failed to save workflow:', error)
    }
  }

  const handleExecute = async () => {
    if (!id) {
      alert('Please save the workflow first before executing')
      return
    }
    try {
      await workflowApi.workflows.execute(id)
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent-purple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading workflow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full">
      <PageHeader
        breadcrumbs={['Workflows', pageTitle]}
        onBackClick={() => void navigate('/workflows')}
        rightContent={
          <div className="flex items-center gap-4">
            {isEditMode && (
              <button
                onClick={() => void handleExecute()}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-teal px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Execute</span>
              </button>
            )}
            <button
              onClick={() => void handleSave(workflowData || { nodes: {}, connections: [] })}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-teal px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>Save Workflow</span>
            </button>
          </div>
        }
        sticky={true}
      />

      <Canvas
        workflowId={id}
        definition={workflowData}
        onSave={definition => void handleSave(definition)}
        onExecute={() => void handleExecute()}
        readOnly={false}
      />
    </div>
  )
}
