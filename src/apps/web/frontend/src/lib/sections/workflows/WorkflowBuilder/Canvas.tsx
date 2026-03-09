import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type {
  Connection as WorkflowConnection,
  NodeDefinition,
  NodeTypeName,
  WorkflowDefinition,
} from '$types/workflow'
import NodePalette from './NodePalette/NodePalette'
import FloatingControls from './CanvasControls/FloatingControls'
import PropertiesPanel from './PropertiesPanel/PropertiesPanel'
import { FunctionNode, ConditionalNode, MergeNode, AINode, StartNode, EndNode } from './nodes'
import { CustomEdge } from './edges'
import type { NodeTypes } from '@xyflow/react'
import type { CanvasProps } from '$types/sections/workflow-builder'

const nodeTypes: NodeTypes = {
  FunctionExecutionNode: FunctionNode,
  ConditionalBranchNode: ConditionalNode,
  FlowMergeNode: MergeNode,
  AIExecutionNode: AINode,
  StartNode: StartNode,
  EndNode: EndNode,
}

const edgeTypes = {
  custom: CustomEdge,
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
      data: { ...nodeDefinition },
    })
  })

  definition.connections.forEach((conn: WorkflowConnection) => {
    edges.push({
      id: `e-${conn.from_id}-${conn.to_id}`,
      source: conn.from_id,
      target: conn.to_id,
      sourceHandle: conn.condition === 'false' ? 'false' : (conn.condition ?? undefined),
      type: 'custom',
    })
  })

  return { nodes, edges }
}

function CanvasContent({
  workflowId: _workflowId,
  definition,
  onSave,
  onExecute,
  readOnly = false,
}: CanvasProps) {
  void onSave
  void onExecute

  const initialFlow = useMemo(() => {
    if (definition) {
      return definitionToReactFlow(definition)
    }
    return {
      nodes: [
        { id: 'start', type: 'StartNode', position: { x: 250, y: 0 }, data: { label: 'Start' } },
        { id: 'end', type: 'EndNode', position: { x: 250, y: 400 }, data: { label: 'End' } },
      ],
      edges: [],
    }
  }, [definition])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false)

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges(addEdge({ ...params, type: 'custom' }, edges))
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
        data: getDefaultNodeData(type),
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

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        <NodePalette onDragStart={() => setIsDragging(true)} />

        <div className="flex-1 relative bg-background-canvas workflow-grid">
          <ReactFlow
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
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.05)"
            />
            <MiniMap
              className="!bg-surface !border-borderLight"
              nodeColor="rgba(255,255,255,0.3)"
              maskColor="rgba(0,0,0,0.8)"
            />
          </ReactFlow>

          <FloatingControls />

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
}

export default function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} />
    </ReactFlowProvider>
  )
}

function getDefaultNodeData(type: NodeTypeName | 'StartNode' | 'EndNode'): Record<string, unknown> {
  switch (type) {
    case 'FunctionExecutionNode':
      return { type: 'FunctionExecutionNode', function_name: 'new_function', params: {} }
    case 'ConditionalBranchNode':
      return { type: 'ConditionalBranchNode', condition: 'true' }
    case 'FlowMergeNode':
      return { type: 'FlowMergeNode', merge_strategy: 'concat' }
    case 'AIExecutionNode':
      return { type: 'AIExecutionNode', prompt: 'Enter prompt', model: 'gemini-1.5-flash' }
    case 'StartNode':
      return { label: 'Start' }
    case 'EndNode':
      return { label: 'End' }
    default:
      return {}
  }
}
