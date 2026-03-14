import { useCallback, useMemo, useState, useImperativeHandle, forwardRef } from 'react'
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
import WorkflowNavbar from './TopNavbar/WorkflowNavbar'
import type { CanvasProps, CanvasHandle } from '$types/sections/workflow-builder'
import { BaseNode, FlowEdge, FlowCanvas } from '$lib/components/graph'
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

const CanvasContent = forwardRef<CanvasHandle, CanvasProps>(function CanvasContent(
  {
    workflowId: _workflowId,
    definition,
    onSave,
    onExecute: _onExecute,
    readOnly = false,
    workflowName,
    onExportJson,
  },
  ref
) {
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
          data: { label: 'Start', mode: 'edit' as const },
        },
        {
          id: 'end',
          type: 'EndNode',
          position: { x: 600, y: 200 },
          data: { label: 'End', mode: 'edit' as const },
        },
      ],
      edges: [],
    }
  }, [definition])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
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
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes(ns => ns.map(n => (n.id === nodeId ? { ...n, data } : n)))
      // Keep selectedNode in sync so the left panel reflects live changes
      setSelectedNode(prev => (prev?.id === nodeId ? { ...prev, data } : prev))
    },
    [setNodes]
  )

  // handleAddNode is called from FloatingControls which is inside ReactFlowProvider —
  // it receives a fully-constructed node (with position already in flow coordinates)
  const handleAddNode = useCallback(
    (newNode: Node) => {
      setNodes(ns => [...ns, newNode])
    },
    [setNodes]
  )

  const getWorkflowDefinition = useCallback((): WorkflowDefinition | null => {
    try {
      const graph = canvasNodesToGraph(nodes, edges)
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

  const getValidationErrors = useCallback((): string[] => {
    try {
      const graph = canvasNodesToGraph(nodes, edges)
      const validation = validateWorkflowGraph(graph)
      return validation.errors
    } catch (error) {
      return [error instanceof Error ? error.message : 'Unknown error']
    }
  }, [nodes, edges])

  useImperativeHandle(ref, () => ({
    getWorkflowDefinition,
    getValidationErrors,
  }))

  return (
    <div className="h-full w-full flex flex-col">
      <WorkflowNavbar
        onSave={onSave}
        onExportJson={onExportJson}
        workflowName={workflowName}
        readOnly={readOnly}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <NodePropertiesPanel selectedNode={selectedNode} onNodeUpdate={handleNodeUpdate} />

        <div className="flex-1 relative workflow-grid overflow-hidden">
          {/* Canvas gradient blobs — show through transparent background */}
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 animate-blob pointer-events-none z-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 animate-blob animation-delay-2000 pointer-events-none z-0"
            style={{ backgroundColor: 'var(--color-primary-hover)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-15 animate-blob animation-delay-4000 pointer-events-none z-0"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
          {validationError && (
            <div className="absolute top-0 left-0 right-0 z-20 bg-error/10 border-b border-error text-error px-4 py-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                <pre className="whitespace-pre-wrap font-mono">{validationError}</pre>
              </div>
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
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            showMiniMap={true}
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
