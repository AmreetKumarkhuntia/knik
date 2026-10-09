import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  getViewportForBounds,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { BaseNodeData, FlowCanvasProps } from '$types/graph'
import { CANVAS_OVERLAY_COLORS } from '$lib/constants/themes'
import { getNodeMetadata, getNodeTitle } from '$lib/constants/nodes'
import FlowViewportControls from './FlowViewportControls'

export type { FlowCanvasProps }

// Cached per source node so unchanged nodes keep their identity and xyflow skips re-adopting them.
const labelledNodes = new WeakMap<Node, Node>()

/** xyflow names a focusable node only through `ariaLabel`; otherwise it is announced as "node". */
function withAccessibleName(node: Node): Node {
  if (node.ariaLabel) return node
  const cached = labelledNodes.get(node)
  if (cached) return cached
  const metadata = getNodeMetadata(node.type ?? '')
  if (!metadata) return node
  const { label, status } = node.data as BaseNodeData
  const labelled = {
    ...node,
    ariaLabel: [label || metadata.label, metadata.typeLabel, status].filter(Boolean).join(', '),
  }
  labelledNodes.set(node, labelled)
  return labelled
}

const labelledEdges = new WeakMap<Edge, Edge>()

/** Without `ariaLabel`, xyflow announces an edge by its internal node ids. */
function withEdgeName(edge: Edge, nodesById: Map<string, Node>): Edge {
  if (edge.ariaLabel) return edge
  const title = (id: string) => {
    const node = nodesById.get(id)
    return node ? getNodeTitle(node) : id
  }
  const source = nodesById.get(edge.source)
  const branch = getNodeMetadata(source?.type ?? '')?.handles.outputs.find(
    handle => handle.id !== undefined && handle.id === edge.sourceHandle
  )?.label
  const ariaLabel = `Connection from ${title(edge.source)}${branch ? ` (${branch})` : ''} to ${title(edge.target)}`
  const cached = labelledEdges.get(edge)
  if (cached?.ariaLabel === ariaLabel) return cached
  const labelled = { ...edge, ariaLabel }
  labelledEdges.set(edge, labelled)
  return labelled
}

/** Inner ReactFlow canvas with background and optional mini-map. */
function FlowCanvasContent({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  nodesDraggable = true,
  nodesConnectable = true,
  elementsSelectable = true,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  showMiniMap = false,
  fitView = true,
  fitOnResize = false,
  minZoom = 0.5,
  showControls = true,
  zoomOnScroll = true,
  panOnScroll = false,
  className = '',
  children,
}: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const accessibleNodes = useMemo(() => nodes.map(withAccessibleName), [nodes])
  const accessibleEdges = useMemo(() => {
    const nodesById = new Map(nodes.map(node => [node.id, node]))
    return edges.map(edge => withEdgeName(edge, nodesById))
  }, [nodes, edges])
  const { setViewport, getNodesBounds, getNodes } = useReactFlow()
  const fitGraph = useCallback(() => {
    const canvas = canvasRef.current
    const currentNodes = getNodes()
    if (!canvas || !currentNodes.length) return
    const bounds = getNodesBounds(currentNodes)
    const viewport = getViewportForBounds(
      bounds,
      canvas.clientWidth,
      Math.max(1, canvas.clientHeight - 80),
      minZoom,
      1,
      0.12
    )
    void setViewport({ ...viewport, y: viewport.y + 12 })
  }, [getNodes, getNodesBounds, minZoom, setViewport])
  useEffect(() => {
    if (!fitOnResize || !nodes.length || !canvasRef.current) return
    // Responsive shell navigation changes the canvas width after its initial fit.
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        fitGraph()
      })
    })
    observer.observe(canvasRef.current)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [fitOnResize, fitGraph, nodes])
  return (
    <ReactFlow
      ref={canvasRef}
      nodes={accessibleNodes}
      edges={accessibleEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodesDraggable={nodesDraggable}
      nodesConnectable={nodesConnectable}
      elementsSelectable={elementsSelectable}
      fitView={fitView}
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={minZoom}
      zoomOnScroll={zoomOnScroll}
      panOnScroll={panOnScroll}
      className={`knik-flow ${className}`}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color={CANVAS_OVERLAY_COLORS.dotGrid}
      />
      {showMiniMap && (
        <MiniMap
          position="bottom-right"
          style={{ width: 144, height: 88, margin: 16 }}
          className="!bg-[var(--bg-surface)] !border !border-[var(--border-2)] !rounded-[10px] !shadow-none"
          nodeColor={CANVAS_OVERLAY_COLORS.minimapNode}
          maskColor={CANVAS_OVERLAY_COLORS.minimapMask}
          nodeBorderRadius={3}
          pannable
          zoomable
          ariaLabel="Workflow overview"
        />
      )}
      {showControls && <FlowViewportControls onFit={fitGraph} />}
      {children}
    </ReactFlow>
  )
}

/** Flow canvas wrapped in a ReactFlow provider for context. */
export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasContent {...props} />
    </ReactFlowProvider>
  )
}
