import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banner, EmptyState } from '$components'
import Button from '$components/buttons/Button'
import { useDemoSession } from '$widgets/session/useDemoSession'
import { generateId } from '$utils/uuid'
import type { CanvasHandle, WorkflowBuilderWidgetProps } from '$types/sections/workflow-builder'
import Canvas from './builder/Canvas'

export default function WorkflowBuilderWidget({ workflowId }: WorkflowBuilderWidgetProps) {
  const navigate = useNavigate()
  const workflow = useDemoSession(state => state.workflows.find(item => item.id === workflowId))
  const saveWorkflow = useDemoSession(state => state.saveWorkflow)
  const runWorkflow = useDemoSession(state => state.runWorkflow)
  const runScenarios = useDemoSession(state => state.runScenarios)
  const addToast = useDemoSession(state => state.addToast)
  const canRun = !!workflowId && Object.hasOwn(runScenarios, workflowId)
  const [workflowName, setWorkflowName] = useState(workflow?.name ?? 'Untitled workflow')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<CanvasHandle>(null)
  if (workflowId && !workflow)
    return (
      <EmptyState
        icon="search_off"
        title="Workflow not found"
        description="This workflow is not available in the current demo session."
        action={<Button onClick={() => void navigate('/workflows')}>View workflows</Button>}
      />
    )

  const handleSave = () => {
    if (!workflowName.trim()) {
      setError('Enter a workflow name.')
      return
    }
    const definition = canvasRef.current?.getWorkflowDefinition()
    if (!definition) return
    const result = saveWorkflow({
      ...workflow,
      id: workflowId ?? generateId('workflow-'),
      name: workflowName.trim(),
      definition,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    addToast('Workflow saved for this session.', 'success')
    void navigate('/workflows')
  }
  const handleRun = () => {
    if (!workflowId) {
      addToast('Save the workflow and supply a demo run scenario first.', 'info')
      return
    }
    const result = runWorkflow(workflowId)
    if (!result.ok) addToast(result.error, 'info')
    else if (result.id !== undefined) void navigate(`/executions/${result.id}`)
  }
  const handleExport = () => {
    const definition = canvasRef.current?.getWorkflowDefinition()
    if (!definition) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(definition, null, 2)], { type: 'application/json' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflowName.trim() || 'workflow'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
      {error && <Banner variant="danger">{error}</Banner>}
      {!canRun && (
        <Banner variant="info">
          Run is unavailable until a demo scenario is supplied. Editing and JSON export are
          available.
        </Banner>
      )}
      <Canvas
        ref={canvasRef}
        workflowId={workflowId}
        definition={workflow?.definition}
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        onBack={() => void navigate('/workflows')}
        onSave={handleSave}
        onExecute={handleRun}
        canRun={canRun}
        onExportJson={handleExport}
      />
    </div>
  )
}
