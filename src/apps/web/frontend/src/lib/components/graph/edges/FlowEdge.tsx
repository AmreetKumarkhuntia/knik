import { memo } from 'react'
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { FlowEdgeData } from '$types/graph'
import { EDGE_STATUS_COLORS } from '$lib/constants/themes'

export type { FlowEdgeData }

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
  const color =
    status === 'failed'
      ? EDGE_STATUS_COLORS.failed
      : status === 'success'
        ? EDGE_STATUS_COLORS.success
        : status === 'running'
          ? EDGE_STATUS_COLORS.running
          : EDGE_STATUS_COLORS.default
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ ...style, stroke: color, strokeWidth: 1.75 }}
      markerEnd={markerEnd}
    />
  )
})
