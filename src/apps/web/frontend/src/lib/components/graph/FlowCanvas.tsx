import { ReactFlowProvider, ReactFlow, Background, MiniMap, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { FlowCanvasProps } from '$types/graph'
import { CANVAS_OVERLAY_COLORS } from '$lib/constants/themes'

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
  zoomOnScroll = true,
  panOnScroll = false,
  className = '',
  children,
}: FlowCanvasProps) {
  return (
    <ReactFlow
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
      zoomOnScroll={zoomOnScroll}
      panOnScroll={panOnScroll}
      className={className}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color={CANVAS_OVERLAY_COLORS.dotGrid}
      />
      {showMiniMap && (
        <MiniMap
          className="!bg-surfaceRaised !border-border"
          nodeColor={CANVAS_OVERLAY_COLORS.minimapNode}
          maskColor={CANVAS_OVERLAY_COLORS.minimapMask}
        />
      )}
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
