import { useMemo } from 'react'
import { type NodeTypes, type EdgeTypes } from '@xyflow/react'

import type { ExecutionFlowGraphProps } from '$types/components'
import { workflowDefinitionToGraph, type ExecutionNodeData } from '$lib/data-structures'
import LoadingSpinner from '../feedback/LoadingSpinner'
import { BaseNode, FlowEdge, FlowCanvas } from '../graph'

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
export default function ExecutionFlowGraph({
  definition,
  definitionError,
  timeline,
}: ExecutionFlowGraphProps) {
  const graphData = useMemo(() => {
    if (!definition) return null
    try {
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

      return graph.toCanvasNodes({
        layout: 'dag',
        width: 900,
        height: 500,
        nodeType: 'default',
        edgeType: 'default',
      })
    } catch (err) {
      console.error('Failed to build execution graph:', err)
      return null
    }
  }, [definition, timeline])

  if (definitionError) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-surface-2 rounded-lg">
        <p className="text-[var(--danger)]">{definitionError}</p>
      </div>
    )
  }

  if (!definition) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-surface-2 rounded-lg">
        <LoadingSpinner />
      </div>
    )
  }

  if (!graphData) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-surface-2 rounded-lg">
        <p className="text-[var(--danger)]">Failed to load execution graph</p>
      </div>
    )
  }

  return (
    <div className="h-[500px] bg-[var(--bg-canvas)] rounded-lg overflow-hidden workflow-grid">
      <FlowCanvas
        nodes={graphData.nodes}
        edges={graphData.edges}
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
