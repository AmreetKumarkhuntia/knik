import { ReactFlowProvider, ReactFlow, Background, MiniMap, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { FlowCanvasProps } from '$types/graph'

export type { FlowCanvasProps }

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
        color="rgba(255,255,255,0.05)"
      />
      {showMiniMap && (
        <MiniMap
          className="!bg-[#171717] !border-white/10"
          nodeColor="rgba(255,255,255,0.3)"
          maskColor="rgba(0,0,0,0.8)"
        />
      )}
      {children}
    </ReactFlow>
  )
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasContent {...props} />
    </ReactFlowProvider>
  )
}
