import { useEffect, useState } from 'react'
import { type Node, type Edge, type NodeTypes, type EdgeTypes } from '@xyflow/react'

import type {
  NodeExecutionStep,
  WorkflowDefinition,
  Connection as WorkflowConnection,
} from '$types/workflow'
import type { ExecutionFlowGraphProps } from '$types/components'
import { getNodeLabel } from '$lib/constants/nodes'
import { workflowApi } from '$services/workflowApi'
import LoadingSpinner from './LoadingSpinner'
import { BaseNode, FlowEdge, FlowCanvas } from './graph'

// Use unified components with execution mode
// Map all node types to BaseNode (same as WorkflowBuilder)
const nodeTypes: NodeTypes = {
  FunctionExecutionNode: BaseNode,
  ConditionalBranchNode: BaseNode,
  FlowMergeNode: BaseNode,
  AIExecutionNode: BaseNode,
  StartNode: BaseNode,
  EndNode: BaseNode,
}

const edgeTypes: EdgeTypes = {
  default: FlowEdge,
}

export default function ExecutionFlowGraph({ execution, timeline }: ExecutionFlowGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function buildGraph() {
      try {
        setLoading(true)
        setError(null)

        // Fetch workflow definition to get connections
        const workflowDetail = await workflowApi.workflows.get(execution.workflow_id)
        const definition: WorkflowDefinition = workflowDetail.workflow

        // Create a map of node executions by node_id
        const nodeExecutionMap = new Map<string, NodeExecutionStep>()
        timeline.forEach(ne => {
          nodeExecutionMap.set(ne.node_id, ne)
        })

        // Build nodes from workflow definition + execution data
        const flowNodes: Node[] = []
        const executedNodeIds = new Set(timeline.map(ne => ne.node_id))

        Object.entries(definition.nodes).forEach(([nodeId, nodeDef], index) => {
          const nodeExecution = nodeExecutionMap.get(nodeId)
          const isExecuted = executedNodeIds.has(nodeId)
          const nodeType = (nodeDef as { type: string }).type
          const status = isExecuted ? nodeExecution?.status : 'pending'

          flowNodes.push({
            id: nodeId,
            type: nodeType, // Use actual node type (e.g., 'FunctionExecutionNode')
            position: { x: 100, y: index * 100 },
            data: {
              type: nodeType,
              label: getNodeLabel(nodeType) || nodeId,
              mode: 'execution' as const,
              status: status as 'pending' | 'running' | 'success' | 'failed',
              duration: nodeExecution?.duration_ms,
            },
          })
        })

        // Build edges from workflow definition connections with status-based coloring
        const flowEdges: Edge[] = definition.connections.map((conn: WorkflowConnection) => {
          const sourceExecution = nodeExecutionMap.get(conn.from_id)
          const targetExecution = nodeExecutionMap.get(conn.to_id)

          const sourceStatus = sourceExecution?.status
          const targetStatus = targetExecution?.status

          // Determine edge status based on connected nodes
          let edgeStatus: 'pending' | 'running' | 'success' | 'failed' = 'pending'

          // Failed if either node failed
          if (sourceStatus === 'failed' || targetStatus === 'failed') {
            edgeStatus = 'failed'
          }
          // Success if both nodes succeeded
          else if (sourceStatus === 'success' && targetStatus === 'success') {
            edgeStatus = 'success'
          }
          // Running if either node is running
          else if (sourceStatus === 'running' || targetStatus === 'running') {
            edgeStatus = 'running'
          }

          return {
            id: `e-${conn.from_id}-${conn.to_id}`,
            source: conn.from_id,
            target: conn.to_id,
            type: 'default', // Use FlowEdge component
            data: {
              mode: 'execution' as const,
              status: edgeStatus,
            },
          }
        })

        setNodes(flowNodes)
        setEdges(flowEdges)
      } catch (err) {
        console.error('Failed to build execution graph:', err)
        setError('Failed to load execution graph')
      } finally {
        setLoading(false)
      }
    }

    void buildGraph()
  }, [execution, timeline])

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-surface rounded-lg">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-surface rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-[400px] bg-surface rounded-lg overflow-hidden">
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={true}
        panOnScroll={false}
        showMiniMap={false}
      />
    </div>
  )
}
