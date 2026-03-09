import { memo } from 'react'
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'

export default memo(function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <g>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
        </linearGradient>
        <marker
          id={`arrowhead-${id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="url(#gradient-green-red)" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: 'url(#gradient-green-red)',
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
})
