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
  NodeTypeName,
  WorkflowDefinition,
} from '$types/workflow'
import NodePalette from './NodePalette/NodePalette'
import FloatingControls from './CanvasControls/FloatingControls'
import PropertiesPanel from './PropertiesPanel/PropertiesPanel'
import type { CanvasProps, CanvasHandle } from '$types/sections/workflow-builder'
import { getDefaultNodeData } from '$lib/constants/nodes'
import { BaseNode, FlowEdge, FlowCanvas } from '$lib/components/graph'
import {
  canvasNodesToGraph,
  graphToWorkflowDefinition,
  validateWorkflowGraph,
} from '$lib/data-structures'

// Use unified BaseNode for all node types
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

let nodeIdCounter = 0
const generateNodeId = () => `node_${++nodeIdCounter}_${Date.now()}`

function definitionToReactFlow(definition: WorkflowDefinition): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  Object.entries(definition.nodes).forEach(([id, nodeDef], index) => {
    const nodeDefinition = nodeDef as NodeDefinition
    nodes.push({
      id,
      type: nodeDefinition.type,
      position: { x: 100, y: index * 120 },
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
  { workflowId: _workflowId, definition, onSave, onExecute, readOnly = false },
  ref
) {
  void onExecute
  void onSave

  const initialFlow = useMemo(() => {
    if (definition) {
      return definitionToReactFlow(definition)
    }
    return {
      nodes: [
        {
          id: 'start',
          type: 'StartNode',
          position: { x: 250, y: 0 },
          data: { label: 'Start', mode: 'edit' as const },
        },
        {
          id: 'end',
          type: 'EndNode',
          position: { x: 250, y: 400 },
          data: { label: 'End', mode: 'edit' as const },
        },
      ],
      edges: [],
    }
  }, [definition])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false)
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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)

      const type = event.dataTransfer.getData('application/reactflow') as
        | NodeTypeName
        | 'StartNode'
        | 'EndNode'

      const bounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect()
      if (!bounds) return

      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }

      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: {
          ...getDefaultNodeData(type),
          mode: 'edit' as const,
        },
      }

      setNodes(nodes => [...nodes, newNode])
    },
    [setNodes]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setPropertiesPanelOpen(true)
  }, [])

  const onPaneClick = useCallback(() => {
    setPropertiesPanelOpen(false)
    setSelectedNode(null)
  }, [])

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes(nodes => nodes.map(node => (node.id === nodeId ? { ...node, data } : node)))
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
      {validationError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">error</span>
            <div>
              <strong>Validation Error:</strong>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{validationError}</pre>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
        <NodePalette onDragStart={() => setIsDragging(true)} />

        <div className="flex-1 relative bg-background-canvas workflow-grid">
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
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            fitView
            className={isDragging ? 'cursor-copy' : ''}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            showMiniMap={true}
          >
            <FloatingControls />
          </FlowCanvas>

          <PropertiesPanel
            selectedNode={selectedNode}
            isOpen={propertiesPanelOpen}
            onClose={() => setPropertiesPanelOpen(false)}
            onNodeUpdate={handleNodeUpdate}
          />
        </div>
      </div>
    </div>
  )
})

CanvasContent.displayName = 'Canvas'

export default CanvasContent
