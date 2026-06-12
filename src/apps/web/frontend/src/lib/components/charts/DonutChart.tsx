import React from 'react'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

export interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  className?: string
}

export default function DonutChart({ segments, size = 120, className = '' }: DonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)

  const radius = 40
  const center = 50
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--bg-surface-2)"
          strokeWidth="12"
        />

        {segments.map((seg, i) => {
          const percentage = seg.value / total
          const strokeLength = percentage * circumference
          const dasharray = `${strokeLength} ${circumference}`
          const dashoffset = 0

          // Start angle = sum of all preceding segments' share of the circle
          const startAngle = (segments.slice(0, i).reduce((a, s) => a + s.value, 0) / total) * 360
          const rotation = `rotate(${startAngle} ${center} ${center})`

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={rotation}
              className="transition-all duration-300 hover:stroke-width-16 hover:opacity-80 cursor-pointer"
            >
              <title>
                {seg.label}: {seg.value}
              </title>
            </circle>
          )
        })}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl font-bold text-fg-1">{total}</span>
        <span className="text-xs text-fg-3">Total</span>
      </div>
    </div>
  )
}
