import { useEffect, useState } from 'react'
import { type NodeTypes, type EdgeTypes } from '@xyflow/react'
import NodePropertiesPanel from './NodePropertiesPanel/NodePropertiesPanel'
import FloatingControls from './CanvasControls/FloatingControls'
import WorkflowNavbar from '$components/workflows/WorkflowNavbar'
import { Banner } from '$components'
import type { CanvasProps } from '$types/sections/workflow-builder'
import { BaseNode, FlowEdge, FlowCanvas } from '$components/graph'

const nodeTypes: NodeTypes = {
  FunctionExecutionNode: BaseNode,
  ConditionalBranchNode: BaseNode,
  FlowMergeNode: BaseNode,
  AIExecutionNode: BaseNode,
  StartNode: BaseNode,
  EndNode: BaseNode,
}

const edgeTypes: EdgeTypes = {
  custom: FlowEdge,
}

export default function Canvas({
  nodes,
  edges,
  selectedNode,
  error,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectNode,
  onNodeUpdate,
  onAddNode,
  onSave,
  onExecute,
  onNameChange,
  onBack,
  canRun,
  readOnly = false,
  workflowName,
  onExportJson,
  modelOptions,
  fieldDrafts,
  onFieldDraftChange,
}: CanvasProps) {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return (
    <div className="h-full min-h-0 w-full flex flex-col">
      <WorkflowNavbar
        onSave={onSave}
        onExecute={onExecute}
        onNameChange={onNameChange}
        onBack={onBack}
        canRun={canRun}
        onExportJson={onExportJson}
        workflowName={workflowName}
        readOnly={readOnly}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <NodePropertiesPanel
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          compact={narrow}
          onClose={() => onSelectNode(null)}
          modelOptions={modelOptions}
          fieldDrafts={fieldDrafts}
          onFieldDraftChange={onFieldDraftChange}
        />
        <div className="flex-1 relative workflow-grid overflow-hidden">
          {error && (
            <div className="absolute top-0 left-0 right-0 z-20">
              <Banner variant="danger">
                <pre className="whitespace-pre-wrap font-mono">{error}</pre>
              </Banner>
            </div>
          )}
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            onNodeClick={(_event, node) => onSelectNode(node.id)}
            onPaneClick={() => onSelectNode(null)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={narrow ? 0.2 : 0.5}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            showMiniMap={!narrow}
          >
            <FloatingControls onAddNode={readOnly ? undefined : onAddNode} />
          </FlowCanvas>
        </div>
      </div>
    </div>
  )
}
