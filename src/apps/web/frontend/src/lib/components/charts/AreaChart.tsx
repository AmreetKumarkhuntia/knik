import React from 'react'

export interface AreaChartProps {
  data: any[]
  xKey: string
  yKey: string
  legend?: boolean
  gradient?: boolean
  className?: string
}

export default function AreaChart({ data, yKey, gradient = true, className = '' }: AreaChartProps) {
  if (!data || data.length === 0) return null

  const width = 100
  const height = 40
  const max = Math.max(...data.map(d => Number(d[yKey]) || 0))
  const min = Math.min(...data.map(d => Number(d[yKey]) || 0))
  const range = max - min || 1

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (((Number(d[yKey]) || 0) - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const areaPath = `M0,${height} L${points} L${width},${height} Z`

  return (
    <div className={`w-full h-full relative ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        {gradient && (
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--aurora-400)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--aurora-400)" stopOpacity="0" />
            </linearGradient>
          </defs>
        )}
        <path
          d={areaPath}
          fill={gradient ? 'url(#areaGradient)' : 'var(--primary)'}
          fillOpacity={gradient ? 1 : 0.1}
          className="transition-all duration-300"
        />
        <polyline
          fill="none"
          stroke="var(--aurora-400)"
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  )
}
