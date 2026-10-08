import { ToggleSwitch, LoadingSpinner, EmptyState, MS, Badge, Card } from '$components'
import IconTile from '$components/display/IconTile'
import Button from '$components/buttons/Button'
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
    <Card padding="none">
      {loading ? (
        <LoadingSpinner size="sm" className="py-10" />
      ) : error ? (
        <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--danger)' }}>{error}</div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon="schedule"
          title="No schedules yet"
          description="Add a schedule to preview it in this session. No jobs are executed."
        />
      ) : (
        schedules.map((s, i) => {
          const wfName = workflowNames[s.target_workflow_id] ?? s.target_workflow_id
          return (
            <div
              key={s.id}
              className="group flex items-center flex-wrap sm:flex-nowrap"
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
              <Badge variant={s.enabled ? 'success' : 'default'}>
                {s.enabled ? 'Active' : 'Paused'}
              </Badge>
              <ToggleSwitch
                aria-label={`Enable schedule for ${wfName}`}
                checked={s.enabled}
                onChange={v => onToggle(s, v)}
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-[var(--danger)]"
                icon={<MS name="delete" size={15} />}
                title={`Delete schedule for ${wfName}`}
                aria-label={`Delete schedule for ${wfName}`}
                onClick={() => onDelete(s)}
              />
            </div>
          )
        })
      )}
    </Card>
  )
}
