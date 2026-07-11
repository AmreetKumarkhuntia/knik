import { ActionIcon, ToggleSwitch, LoadingSpinner, EmptyState, MS } from '$components'
import { StatusPill, SurfaceCard, IconTile } from '$widgets'
import { formatDate } from '$utils/format'
import type { ScheduleListPanelProps } from '$types/sections/schedules'

/** Cron schedule list: per-row icon, status pill, enable toggle, and delete. */
export default function ScheduleListPanel({
  schedules,
  workflowNames,
  loading,
  error,
  onToggle,
  onDelete,
}: ScheduleListPanelProps) {
  return (
    <SurfaceCard>
      {loading ? (
        <LoadingSpinner size="sm" className="py-10" />
      ) : error ? (
        <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--danger)' }}>{error}</div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon="schedule"
          title="No schedules yet"
          description="Schedule a workflow to run on a recurring basis."
        />
      ) : (
        schedules.map((s, i) => {
          const wfName = workflowNames[s.target_workflow_id] ?? s.target_workflow_id
          return (
            <div
              key={s.id}
              className="group flex items-center"
              style={{
                gap: 16,
                padding: '15px 18px',
                borderBottom: i === schedules.length - 1 ? 'none' : '1px solid var(--border-1)',
              }}
            >
              <IconTile
                size={36}
                bg={s.enabled ? 'var(--acc-soft)' : 'var(--bg-surface-3)'}
                color={s.enabled ? 'var(--acc-text, var(--aurora-300))' : 'var(--fg-4)'}
                icon={<MS name="schedule" size={19} />}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="truncate"
                  style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-1)' }}
                >
                  {wfName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 1 }}>
                  {s.schedule_description ?? 'Recurring'}
                </div>
              </div>
              <div style={{ width: 170, textAlign: 'right' }}>
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 500 }}>
                  {s.next_run_at ? formatDate(s.next_run_at) : '—'}
                </div>
                <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--fg-5)' }}>
                  {s.timezone || 'UTC'}
                </div>
              </div>
              <StatusPill
                tone={s.enabled ? 'success' : 'neutral'}
                label={s.enabled ? 'Active' : 'Paused'}
              />
              <ToggleSwitch checked={s.enabled} onChange={v => onToggle(s, v)} />
              <ActionIcon
                size={30}
                icon={<MS name="delete" size={15} />}
                title="Delete"
                danger
                onClick={() => onDelete(s)}
              />
            </div>
          )
        })
      )}
    </SurfaceCard>
  )
}
