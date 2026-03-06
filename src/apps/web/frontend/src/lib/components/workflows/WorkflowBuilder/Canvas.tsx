import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  Panel,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type {
  Connection as WorkflowConnection,
  NodeDefinition,
  NodeTypeName,
  WorkflowDefinition,
} from '$types/workflow'
import { ActionButton } from '../common'
import NodePalette from './NodePalette'
import { FunctionNode, ConditionalNode, MergeNode, AINode, StartNode, EndNode } from './nodes'
import { CustomEdge } from './edges'
import type { NodeTypes } from '@xyflow/react'

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

interface CanvasProps {
  workflowId?: string
  definition?: WorkflowDefinition
  onSave?: (definition: WorkflowDefinition) => void
  onExecute?: () => void
  readOnly?: boolean
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

function reactFlowToDefinition(nodes: Node[], edges: Edge[]): WorkflowDefinition {
  const definitionNodes: Record<string, NodeDefinition> = {}
  const connections: WorkflowConnection[] = []

  nodes.forEach(node => {
    if (node.type === 'StartNode' || node.type === 'EndNode') return
    const nodeData = node.data as unknown
    if (!nodeData || typeof nodeData !== 'object') return
    definitionNodes[node.id] = nodeData as NodeDefinition
  })

  edges.forEach(edge => {
    connections.push({
      from_id: edge.source,
      to_id: edge.target,
      condition: edge.sourceHandle ?? undefined,
    })
  })

  return { nodes: definitionNodes, connections }
}

export default function Canvas({
  workflowId: _workflowId,
  definition,
  onSave,
  onExecute,
  readOnly = false,
}: CanvasProps) {
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
      if (!type) return

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

  const handleSave = useCallback(() => {
    const def = reactFlowToDefinition(nodes, edges)
    onSave?.(def)
  }, [nodes, edges, onSave])

  return (
    <div className="h-full w-full bg-gray-950 rounded-xl overflow-hidden border border-white/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
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
          color="rgba(255,255,255,0.1)"
        />
        <Controls className="!bg-black/30 !border-white/10 !rounded-lg" />
        <MiniMap
          className="!bg-black/30 !border-white/10"
          nodeColor="rgba(255,255,255,0.3)"
          maskColor="rgba(0,0,0,0.8)"
        />
        <Panel position="top-right" className="flex gap-2">
          {onExecute && (
            <ActionButton icon="▶" label="Execute" variant="primary" onClick={onExecute} />
          )}
          {onSave && !readOnly && (
            <ActionButton icon="💾" label="Save" variant="secondary" onClick={handleSave} />
          )}
        </Panel>
      </ReactFlow>

      {!readOnly && (
        <div className="absolute left-4 top-4 z-10">
          <NodePalette onDragStart={() => setIsDragging(true)} />
        </div>
      )}
    </div>
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
