import { memo } from 'react'
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { FlowEdgeData } from '$types/graph'
import { EDGE_STATUS_COLORS } from '$lib/constants/themes'

export default memo(function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  })
  const edgeData = data as FlowEdgeData | undefined
  const status = edgeData?.mode === 'execution' ? edgeData.status : undefined
  const color = EDGE_STATUS_COLORS[status && status !== 'pending' ? status : 'default']
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={status === 'running' ? 'graph-edge graph-edge--running' : 'graph-edge'}
      style={{ ...style, stroke: color, strokeWidth: 2, strokeLinecap: 'round' }}
      markerEnd={markerEnd}
    />
  )
})
