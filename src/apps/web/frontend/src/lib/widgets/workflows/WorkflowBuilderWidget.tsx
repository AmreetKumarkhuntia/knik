import { useNavigate } from 'react-router-dom'
import { Banner, EmptyState } from '$components'
import Button from '$components/buttons/Button'
import { useWorkflowBuilderView } from '$stores/views'
import { useFeedbackStore } from '$stores/feedback'
import type { WorkflowBuilderWidgetProps } from '$types/sections/workflow-builder'
import Canvas from '$components/workflows/builder/Canvas'

export default function WorkflowBuilderWidget({ workflowId }: WorkflowBuilderWidgetProps) {
  const navigate = useNavigate()
  const view = useWorkflowBuilderView(workflowId)
  const addToast = useFeedbackStore(state => state.addToast)
  if (workflowId && !view.workflow)
    return (
      <EmptyState
        icon="search_off"
        title="Workflow not found"
        description="This workflow is not available in the current demo session."
        action={<Button onClick={() => void navigate('/workflows')}>View workflows</Button>}
      />
    )
  const { draft } = view
  if (!draft) return null
  const save = () => {
    const result = view.save()
    if (result.ok) {
      addToast('Workflow saved for this session.', 'success')
      void navigate('/workflows')
    }
  }
  const run = () => {
    const result = view.run()
    if (!result.ok) addToast(result.error, 'info')
    else if (result.id !== undefined) void navigate(`/executions/${result.id}`)
  }
  const exportJson = () => {
    const result = view.validate()
    if (!result.ok) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result.definition, null, 2)], { type: 'application/json' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${draft.name.trim() || 'workflow'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
      {!view.canRun && (
        <Banner variant="info">
          Run is unavailable until a matching demo scenario is supplied. Editing and JSON export are
          available.
        </Banner>
      )}
      <Canvas
        nodes={draft.nodes}
        edges={draft.edges}
        selectedNode={view.selectedNode}
        error={draft.error}
        workflowName={draft.name}
        onNameChange={view.setName}
        onNodesChange={view.changeNodes}
        onEdgesChange={view.changeEdges}
        onConnect={view.connect}
        onSelectNode={view.selectNode}
        onNodeUpdate={view.updateNode}
        onAddNode={view.addNode}
        onBack={() => void navigate('/workflows')}
        onSave={save}
        onExecute={run}
        canRun={view.canRun}
        onExportJson={exportJson}
        modelOptions={view.modelOptions}
        fieldDrafts={draft.fieldDrafts}
        onFieldDraftChange={view.setFieldDraft}
      />
    </div>
  )
}
