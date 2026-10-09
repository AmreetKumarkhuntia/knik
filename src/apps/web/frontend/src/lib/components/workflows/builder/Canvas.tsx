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
  narrow = false,
}: CanvasProps) {
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
        <div className="flex-1 min-w-0 relative flex flex-col workflow-grid overflow-hidden">
          {/* In flow rather than overlaid, so the canvas and its Add Node trigger sit below it. */}
          {error && (
            // Focusable so keyboard users can scroll a long error list; the banner has no controls.
            <div
              tabIndex={0}
              role="region"
              aria-label="Validation errors"
              className="knik-focus shrink-0 max-h-40 overflow-y-auto"
            >
              <Banner variant="danger">
                <pre className="whitespace-pre-wrap font-mono">{error}</pre>
              </Banner>
            </div>
          )}
          <div className="relative flex-1 min-h-0">
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
        <NodePropertiesPanel
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          compact={narrow}
          onClose={() => onSelectNode(null)}
          modelOptions={modelOptions}
          fieldDrafts={fieldDrafts}
          onFieldDraftChange={onFieldDraftChange}
          nodes={nodes}
          onConnect={readOnly ? undefined : onConnect}
        />
      </div>
    </div>
  )
}
