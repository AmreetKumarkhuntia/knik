import { useCallback, useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react'
import {
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'

import type {
  Connection as WorkflowConnection,
  NodeDefinition,
  WorkflowDefinition,
} from '$types/workflow'
import NodePropertiesPanel from './NodePropertiesPanel/NodePropertiesPanel'
import FloatingControls from './CanvasControls/FloatingControls'
import WorkflowNavbar from '$components/workflows/WorkflowNavbar'
import { Banner } from '$components'
import { normalizeNodes } from './normalizeNodes'
import type { CanvasProps, CanvasHandle } from '$types/sections/workflow-builder'
import { BaseNode, FlowEdge, FlowCanvas } from '$components/graph'
import {
  canvasNodesToGraph,
  graphToWorkflowDefinition,
  validateWorkflowGraph,
} from '$lib/data-structures'

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

/** Converts a WorkflowDefinition into ReactFlow nodes and edges. */
function definitionToReactFlow(definition: WorkflowDefinition): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  Object.entries(definition.nodes).forEach(([id, nodeDef], index) => {
    const nodeDefinition = nodeDef as NodeDefinition
    nodes.push({
      id,
      type: nodeDefinition.type,
      position: { x: 100 + index * 280, y: 200 },
      data: {
        ...nodeDefinition,
        mode: 'edit' as const,
      },
    })
  })

  definition.connections.forEach((conn: WorkflowConnection) => {
    edges.push({
      id: `e-${conn.from_id}-${conn.to_id}`,
      source: conn.from_id,
      target: conn.to_id,
      sourceHandle: conn.condition === 'false' ? 'false' : (conn.condition ?? undefined),
      type: 'custom',
      data: {
        mode: 'edit' as const,
      },
    })
  })

  return { nodes, edges }
}

/** Main workflow builder canvas with node editing, validation, and export. */
const CanvasContent = forwardRef<CanvasHandle, CanvasProps>(function CanvasContent(
  {
    workflowId: _workflowId,
    definition,
    onSave,
    onExecute,
    onNameChange,
    onBack,
    canRun,
    readOnly = false,
    workflowName,
    onExportJson,
  },
  ref
) {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const initialFlow = useMemo(() => {
    if (definition) {
      return definitionToReactFlow(definition)
    }
    return {
      nodes: [
        {
          id: 'start',
          type: 'StartNode',
          position: { x: 100, y: 200 },
          data: { type: 'StartNode', label: 'Start', mode: 'edit' as const },
        },
        {
          id: 'end',
          type: 'EndNode',
          position: { x: 600, y: 200 },
          data: { type: 'EndNode', label: 'End', mode: 'edit' as const },
        },
      ],
      edges: [],
    }
  }, [definition])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const selectedNode = nodes.find(node => node.id === selectedNodeId) ?? null
  const [validationError, setValidationError] = useState<string | null>(null)

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges(
        addEdge(
          {
            ...params,
            type: 'custom',
            data: { mode: 'edit' as const },
          },
          edges
        )
      )
    },
    [edges, setEdges]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes(ns => ns.map(n => (n.id === nodeId ? { ...n, data } : n)))
    },
    [setNodes]
  )

  const handleAddNode = useCallback(
    (newNode: Node) => {
      setNodes(ns => [...ns, newNode])
    },
    [setNodes]
  )

  const getWorkflowDefinition = useCallback((): WorkflowDefinition | null => {
    try {
      const graph = canvasNodesToGraph(normalizeNodes(nodes), edges)
      const validation = validateWorkflowGraph(graph)

      if (validation.errors.length > 0) {
        setValidationError(validation.errors.join('\n'))
        return null
      }

      if (validation.warnings.length > 0) {
        console.warn('Workflow validation warnings:', validation.warnings)
      }

      const workflowDefinition = graphToWorkflowDefinition(graph)
      setValidationError(null)
      return workflowDefinition
    } catch (error) {
      console.error('Failed to convert canvas to workflow:', error)
      setValidationError(error instanceof Error ? error.message : 'Failed to convert workflow')
      return null
    }
  }, [nodes, edges])

  useImperativeHandle(ref, () => ({
    getWorkflowDefinition,
  }))

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
          onNodeUpdate={handleNodeUpdate}
          compact={narrow}
          onClose={() => setSelectedNodeId(null)}
        />

        <div className="flex-1 relative workflow-grid overflow-hidden">
          {validationError && (
            <div className="absolute top-0 left-0 right-0 z-20">
              <Banner variant="danger">
                <pre className="whitespace-pre-wrap font-mono">{validationError}</pre>
              </Banner>
            </div>
          )}

          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={narrow ? 0.2 : 0.5}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            showMiniMap={!narrow}
          >
            <FloatingControls onAddNode={readOnly ? undefined : handleAddNode} />
          </FlowCanvas>
        </div>
      </div>
    </div>
  )
})

CanvasContent.displayName = 'Canvas'

export default CanvasContent
