import React from 'react'

export interface TokenMeterProps {
  used: number
  limit: number
  model?: string
  className?: string
}

export default function TokenMeter({
  used,
  limit,
  model = 'Model',
  className = '',
}: TokenMeterProps) {
  const percentage = Math.min(100, Math.max(0, (used / limit) * 100))
  const isWarning = percentage > 80
  const isDanger = percentage > 95

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  return (
    <div className={`flex flex-col gap-2 p-3 knik-card bg-surface-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-2 font-medium flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-aurora-400">database</span>
          {model}
        </span>
        <span className="text-fg-3">
          <span
            className={isDanger ? 'text-error font-bold' : isWarning ? 'text-warning' : 'text-fg-1'}
          >
            {formatNumber(used)}
          </span>
          {' / '}
          {formatNumber(limit)} tokens
        </span>
      </div>

      <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger ? 'bg-error' : isWarning ? 'bg-warning' : 'gradient-brand'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
