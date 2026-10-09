import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Position, type NodeTypes, type EdgeTypes } from '@xyflow/react'

import type { ExecutionFlowGraphProps } from '$types/components'
import { workflowDefinitionToGraph, type ExecutionNodeData } from '$lib/data-structures'
import LoadingSpinner from '../feedback/LoadingSpinner'
import { BaseNode, FlowEdge, FlowCanvas } from '../graph'
import { GRAPH_NODE_SIZE } from '$lib/constants/graph'
import { getNodeMetadata } from '$lib/constants/nodes'

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
  className = 'h-[500px]',
}: ExecutionFlowGraphProps) {
  const container = useRef<HTMLDivElement>(null)
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  // Measure before paint so narrow containers never show the horizontal layout first.
  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const update = (width: number) => setDirection(width < 900 ? 'vertical' : 'horizontal')
    const { width } = element.getBoundingClientRect()
    if (width > 0) update(width)
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [definition])
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

      const canvas = graph.toCanvasNodes({
        layout: 'dag',
        direction,
        nodeSpacingX: 304,
        nodeSpacingY: 144,
        width: 900,
        height: 500,
        nodeType: 'default',
        edgeType: 'default',
      })
      return {
        ...canvas,
        nodes: canvas.nodes.map(node => {
          const terminal = getNodeMetadata(node.type ?? '')?.shape === 'pill'
          const size = terminal ? GRAPH_NODE_SIZE.terminal : GRAPH_NODE_SIZE.process
          return {
            ...node,
            position: { x: node.position.x - size.width / 2, y: node.position.y - size.height / 2 },
            initialWidth: size.width,
            initialHeight: size.height,
            sourcePosition: direction === 'vertical' ? Position.Bottom : Position.Right,
            targetPosition: direction === 'vertical' ? Position.Top : Position.Left,
            data: { ...node.data, direction },
          }
        }),
      }
    } catch (err) {
      console.error('Failed to build execution graph:', err)
      return null
    }
  }, [definition, timeline, direction])

  if (definitionError) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-2`}>
        <p className="text-[var(--danger)]">{definitionError}</p>
      </div>
    )
  }

  if (!definition) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-2`}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!graphData) {
    return (
      <div className={`${className} flex items-center justify-center bg-surface-2`}>
        <p className="text-[var(--danger)]">Failed to load execution graph</p>
      </div>
    )
  }

  return (
    <div
      ref={container}
      data-flow-direction={direction}
      className={`${className} bg-[var(--bg-canvas)] overflow-hidden workflow-grid`}
    >
      {/* Rotating the layout remounts the canvas so xyflow re-measures every rotated handle. */}
      <FlowCanvas
        key={direction}
        nodes={graphData.nodes}
        edges={graphData.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitOnResize
        minZoom={0.1}
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
