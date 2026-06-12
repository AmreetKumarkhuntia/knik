import React from 'react'

export interface StatItem {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  icon?: string
}

export interface StatStripProps {
  stats: StatItem[]
  className?: string
}

export default function StatStrip({ stats, className = '' }: StatStripProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 p-4 knik-card bg-surface-2/50 ${className}`}>
      {stats.map((stat, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center gap-2 text-fg-3 text-sm">
              {stat.icon && (
                <span className="material-symbols-outlined text-[16px]">{stat.icon}</span>
              )}
              <span>{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-fg-1">{stat.value}</span>
              {stat.trend && (
                <span
                  className={`text-xs font-medium flex items-center ${
                    stat.trend.direction === 'up'
                      ? 'text-success'
                      : stat.trend.direction === 'down'
                        ? 'text-error'
                        : 'text-fg-4'
                  }`}
                >
                  {stat.trend.direction === 'up'
                    ? '↑'
                    : stat.trend.direction === 'down'
                      ? '↓'
                      : '→'}
                  {stat.trend.value}
                </span>
              )}
            </div>
          </div>
          {i < stats.length - 1 && <div className="hidden sm:block w-px h-10 bg-border-1 mx-2" />}
        </React.Fragment>
      ))}
    </div>
  )
}
