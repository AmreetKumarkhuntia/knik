import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Canvas from '$sections/workflows/WorkflowBuilder/Canvas'
import type { WorkflowDefinition } from '$types/workflow'
import type { CanvasHandle } from '$types/sections/workflow-builder'
import { workflowApi } from '$services/workflowApi'

export default function WorkflowBuilder() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<CanvasHandle>(null)
  const [workflowData, setWorkflowData] = useState<WorkflowDefinition | undefined>()
  const [workflowName, setWorkflowName] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const isEditMode = !!id

  useEffect(() => {
    if (id) {
      void loadWorkflow(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadWorkflow = async (workflowId: string) => {
    try {
      setIsLoading(true)
      const response = await workflowApi.workflows.get(workflowId)
      setWorkflowData(response.workflow)
      // Derive a display name from the workflow id if not available
      setWorkflowName(id)
    } catch (error) {
      console.error('Failed to load workflow:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!canvasRef.current) return

    const validationErrors = canvasRef.current.getValidationErrors()
    if (validationErrors.length > 0) return

    const workflowDefinition = canvasRef.current.getWorkflowDefinition()
    if (!workflowDefinition) return

    try {
      if (id) {
        await workflowApi.workflows.update(id, workflowName ?? 'Workflow', workflowDefinition)
      } else {
        const name = `Workflow ${new Date().toLocaleDateString()}`
        await workflowApi.workflows.create(name, workflowDefinition)
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

  const handleExportJson = () => {
    if (!canvasRef.current) return
    const definition = canvasRef.current.getWorkflowDefinition()
    if (!definition) return

    const blob = new Blob([JSON.stringify(definition, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName ?? 'workflow'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-2 border-border border-t-foreground rounded-full mx-auto mb-4" />
          <p className="text-xs text-secondary">Loading workflow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full">
      <Canvas
        ref={canvasRef}
        workflowId={id}
        definition={workflowData}
        workflowName={isEditMode ? workflowName : undefined}
        onSave={() => void handleSave()}
        onExecute={() => void handleExecute()}
        onExportJson={handleExportJson}
        readOnly={false}
      />
    </div>
  )
}
