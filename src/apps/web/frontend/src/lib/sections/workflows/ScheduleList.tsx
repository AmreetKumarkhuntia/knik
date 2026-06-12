import React from 'react'
import ToggleSwitch from '../../components/ToggleSwitch'
import Badge from '../../components/Badge'

export interface ScheduleJob {
  id: string
  name: string
  cron: string
  nextRun: string
  active: boolean
  lastStatus?: 'success' | 'failed' | 'running'
}

export interface ScheduleListProps {
  schedules: ScheduleJob[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onToggle?: (id: string, active: boolean) => void
  className?: string
}

export default function ScheduleList({
  schedules,
  onEdit,
  onDelete,
  onToggle,
  className = '',
}: ScheduleListProps) {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="p-8 text-center text-fg-3 knik-card border-dashed">
        <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">
          calendar_clock
        </span>
        <p>No scheduled workflows found.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {schedules.map(job => (
        <div
          key={job.id}
          className="knik-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <ToggleSwitch checked={job.active} onChange={checked => onToggle?.(job.id, checked)} />
            <div>
              <div className="font-medium text-fg-1 flex items-center gap-2">
                {job.name}
                {job.lastStatus === 'success' && (
                  <Badge variant="success" size="sm">
                    Success
                  </Badge>
                )}
                {job.lastStatus === 'failed' && (
                  <Badge variant="danger" size="sm">
                    Failed
                  </Badge>
                )}
                {job.lastStatus === 'running' && (
                  <Badge variant="primary" size="sm">
                    Running
                  </Badge>
                )}
              </div>
              <div className="text-sm text-fg-3 font-mono mt-1">
                <span className="bg-surface-3 px-1.5 py-0.5 rounded text-fg-2 mr-2">
                  {job.cron}
                </span>
                Next run: {job.nextRun}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onEdit?.(job.id)}
              className="p-2 text-fg-3 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
              title="Edit schedule"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={() => onDelete?.(job.id)}
              className="p-2 text-fg-3 hover:text-error hover:bg-error/10 rounded-md transition-colors"
              title="Delete schedule"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
