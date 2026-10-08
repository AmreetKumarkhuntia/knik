import { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  getViewportForBounds,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { FlowCanvasProps } from '$types/graph'
import { CANVAS_OVERLAY_COLORS } from '$lib/constants/themes'
import FlowViewportControls from './FlowViewportControls'

export type { FlowCanvasProps }

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
      nodes={nodes}
      edges={edges}
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
