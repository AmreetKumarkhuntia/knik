import React, { useId, useMemo } from 'react'

export interface SparklineChartProps {
  data: number[]
  color?: string
  width?: number | string
  height?: number | string
  className?: string
}

export default function SparklineChart({
  data,
  color = 'var(--aurora-400)',
  width = '100%',
  height = 64,
  className = '',
}: SparklineChartProps) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    // Map X to 0..280, Y to 48..8
    const paddingY = 16
    const viewBoxHeight = 64
    const viewBoxWidth = 280

    return data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * viewBoxWidth
        const y = viewBoxHeight - paddingY - ((val - min) / range) * (viewBoxHeight - paddingY * 2)
        return `${x},${y}`
      })
      .join(' L')
  }, [data])

  // Stable unique ID for the gradient to prevent conflicts if multiple sparklines exist
  const gradientId = `sp-grad-${useId().replace(/:/g, '')}`

  if (!data || data.length < 2) return null

  const pathD = `M${points}`
  const areaD = `${pathD} L280,64 L0,64 Z`

  // Get coordinates for the last point
  const lastX = 280
  const lastVal = data[data.length - 1]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const paddingY = 16
  const lastY = 64 - paddingY - ((lastVal - min) / range) * (64 - paddingY * 2)

  return (
    <svg
      viewBox="0 0 280 64"
      preserveAspectRatio="none"
      style={{ width, height, display: 'block' }}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
      <circle cx={lastX} cy={lastY} r="7" fill={color} opacity="0.25" />
    </svg>
  )
}
