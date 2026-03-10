import { useEffect, useState } from 'react'
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type {
  NodeExecutionStep,
  ExecutionDetail,
  WorkflowDefinition,
  Connection as WorkflowConnection,
} from '$types/workflow'
import { workflowApi } from '$services/workflowApi'
import LoadingSpinner from './LoadingSpinner'

// Simplified node component for execution view (read-only, colored by status)
function ExecutionNode({ data }: { data: { label: string; status?: string; duration?: number } }) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 border-green-500'
      case 'failed':
        return 'bg-red-500/20 border-red-500'
      case 'running':
        return 'bg-blue-500/20 border-blue-500'
      default:
        return 'bg-gray-500/20 border-gray-500'
    }
  }

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 ${getStatusColor(data.status)} min-w-[120px] text-center`}
    >
      <div className="text-sm font-semibold text-white">{data.label}</div>
      {data.duration !== undefined && (
        <div className="text-xs text-gray-400 mt-1">
          {data.duration < 1000 ? `${data.duration}ms` : `${(data.duration / 1000).toFixed(2)}s`}
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  execution: ExecutionNode,
}

interface ExecutionFlowGraphProps {
  execution: ExecutionDetail
  timeline: NodeExecutionStep[]
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

          flowNodes.push({
            id: nodeId,
            type: 'execution',
            position: { x: 100, y: index * 100 },
            data: {
              label: (nodeDef as { type: string }).type.replace('Node', '') || nodeId,
              status: isExecuted ? nodeExecution?.status : 'pending',
              duration: nodeExecution?.duration_ms,
            },
          })
        })

        // Build edges from workflow definition connections with status-based coloring
        const flowEdges: Edge[] = definition.connections.map((conn: WorkflowConnection) => {
          const sourceExecution = nodeExecutionMap.get(conn.from_id)
          const targetExecution = nodeExecutionMap.get(conn.to_id)

          // Determine edge color based on connected nodes' status
          let edgeColor = '#6b7280' // gray-500 (default/pending)
          let isAnimated = false
          let strokeWidth = 2

          const sourceStatus = sourceExecution?.status
          const targetStatus = targetExecution?.status

          // Red if either node failed
          if (sourceStatus === 'failed' || targetStatus === 'failed') {
            edgeColor = '#ef4444' // red-500
            strokeWidth = 2.5 // Slightly thicker for emphasis
          }
          // Green if both nodes succeeded
          else if (sourceStatus === 'success' && targetStatus === 'success') {
            edgeColor = '#10b981' // green-500
          }
          // Blue/animated if either node is running
          else if (sourceStatus === 'running' || targetStatus === 'running') {
            edgeColor = '#3b82f6' // blue-500
            isAnimated = true
          }

          return {
            id: `e-${conn.from_id}-${conn.to_id}`,
            source: conn.from_id,
            target: conn.to_id,
            animated: isAnimated,
            style: {
              stroke: edgeColor,
              strokeWidth: strokeWidth,
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
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={true}
          panOnScroll={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.05)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
