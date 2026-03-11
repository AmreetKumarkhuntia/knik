import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '$components/PageHeader'
import Canvas from '$sections/workflows/WorkflowBuilder/Canvas'
import type { WorkflowDefinition } from '$types/workflow'
import type { CanvasHandle } from '$types/sections/workflow-builder'
import { workflowApi } from '$services/workflowApi'

export default function WorkflowBuilder() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<CanvasHandle>(null)
  const [workflowData, setWorkflowData] = useState<WorkflowDefinition | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const handleSave = async () => {
    if (!canvasRef.current) {
      console.error('Canvas ref not available')
      return
    }

    const validationErrors = canvasRef.current.getValidationErrors()
    if (validationErrors.length > 0) {
      setSaveError(validationErrors.join('\n'))
      return
    }

    const workflowDefinition = canvasRef.current.getWorkflowDefinition()
    if (!workflowDefinition) {
      setSaveError('Failed to generate workflow definition')
      return
    }

    try {
      setSaveError(null)
      if (id) {
        await workflowApi.workflows.update(id, pageTitle, workflowDefinition)
      } else {
        const workflowName = `Workflow ${new Date().toLocaleDateString()}`
        await workflowApi.workflows.create(workflowName, workflowDefinition)
      }
      void navigate('/workflows')
    } catch (error) {
      console.error('Failed to save workflow:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save workflow')
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
              onClick={() => void handleSave()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-teal px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>Save Workflow</span>
            </button>
          </div>
        }
        sticky={true}
      />

      {saveError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 text-sm mx-4 mt-4">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">error</span>
            <div>
              <strong>Save Error:</strong>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{saveError}</pre>
            </div>
          </div>
        </div>
      )}

      <Canvas
        ref={canvasRef}
        workflowId={id}
        definition={workflowData}
        onExecute={() => void handleExecute()}
        readOnly={false}
      />
    </div>
  )
}
