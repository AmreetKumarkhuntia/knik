import { useEffect, useState } from 'react'
import { type Node, type Edge, type NodeTypes, type EdgeTypes } from '@xyflow/react'

import type { WorkflowDefinition } from '$types/workflow'
import type { ExecutionFlowGraphProps } from '$types/components'
import { workflowApi } from '$services/workflowApi'
import { workflowDefinitionToGraph, type ExecutionNodeData } from '$lib/data-structures'
import LoadingSpinner from './LoadingSpinner'
import { BaseNode, FlowEdge, FlowCanvas } from './graph'

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

/** Renders the workflow execution graph with node statuses. */
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

        const workflowDetail = await workflowApi.workflows.get(execution.workflow_id)
        const definition: WorkflowDefinition = workflowDetail.workflow

        const executionDataMap = new Map<string, ExecutionNodeData>()
        timeline.forEach(step => {
          executionDataMap.set(step.node_id, {
            status: step.status,
            duration: step.duration_ms,
            inputs: step.inputs,
            outputs: step.outputs,
            error_message: step.error_message,
          })
        })

        const graph = workflowDefinitionToGraph(definition, {
          mode: 'execution',
          executionData: executionDataMap,
        })

        const { nodes: canvasNodes, edges: canvasEdges } = graph.toCanvasNodes({
          layout: 'dag',
          width: 900,
          height: 500,
          nodeType: 'default',
          edgeType: 'default',
        })

        setNodes(canvasNodes)
        setEdges(canvasEdges)
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
      <div className="h-[500px] flex items-center justify-center bg-surfaceRaised rounded-lg">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-surfaceRaised rounded-lg">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-[500px] bg-canvas rounded-lg overflow-hidden workflow-grid">
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
