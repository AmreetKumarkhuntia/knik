import React from 'react'

export interface BarChartProps {
  data: any[]
  xKey: string
  yKey: string
  horizontal?: boolean
  className?: string
}

export default function BarChart({
  data,
  yKey,
  horizontal = false,
  className = '',
}: BarChartProps) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data.map(d => Number(d[yKey]) || 0)) || 1

  return (
    <div
      className={`w-full h-full flex ${horizontal ? 'flex-col justify-between' : 'flex-row items-end justify-between'} gap-1 ${className}`}
    >
      {data.map((d, i) => {
        const val = Number(d[yKey]) || 0
        const percentage = (val / max) * 100

        if (horizontal) {
          return (
            <div
              key={i}
              className="w-full h-full relative group bg-surface-2 rounded-sm overflow-hidden flex-1"
            >
              <div
                className="absolute top-0 bottom-0 left-0 bg-aurora-400/50 group-hover:bg-aurora-400 transition-colors rounded-sm"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )
        }

        return (
          <div
            key={i}
            className="h-full flex-1 relative group bg-surface-2 rounded-t-sm overflow-hidden flex items-end"
          >
            <div
              className="w-full bg-aurora-400/50 group-hover:bg-aurora-400 transition-colors rounded-t-sm"
              style={{ height: `${percentage}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}
