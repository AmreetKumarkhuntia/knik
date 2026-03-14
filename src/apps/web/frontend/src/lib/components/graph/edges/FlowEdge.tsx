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
  })

  const edgeData = data as FlowEdgeData | undefined
  const mode = edgeData?.mode || 'edit'
  const status = edgeData?.status || 'pending'

  if (mode === 'edit') {
    return (
      <g>
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor={EDGE_STATUS_COLORS.success} stopOpacity="1" />
            <stop offset="100%" stopColor={EDGE_STATUS_COLORS.failed} stopOpacity="1" />
          </linearGradient>
          <marker
            id={`arrowhead-${id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={`url(#gradient-${id})`} />
          </marker>
        </defs>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            ...style,
            stroke: `url(#gradient-${id})`,
            strokeWidth: 2,
            strokeDasharray: '5,5',
            animation: 'dash 1s linear infinite',
          }}
          markerEnd={markerEnd}
        />
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -20;
              }
            }
          `}
        </style>
      </g>
    )
  }

  let edgeColor: string = EDGE_STATUS_COLORS.default
  let strokeWidth = 2

  switch (status) {
    case 'failed':
      edgeColor = EDGE_STATUS_COLORS.failed
      strokeWidth = 2.5
      break
    case 'success':
      edgeColor = EDGE_STATUS_COLORS.success
      break
    case 'running':
      edgeColor = EDGE_STATUS_COLORS.running
      break
    case 'pending':
    default:
      edgeColor = EDGE_STATUS_COLORS.default
      break
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: edgeColor,
        strokeWidth: strokeWidth,
      }}
      markerEnd={markerEnd}
    />
  )
})
