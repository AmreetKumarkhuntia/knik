import { useState, useEffect } from 'react'
import ActionButton from '$components/ActionButton'
import ActionIcon from '$components/ActionIcon'
import ToggleSwitch from '$components/ToggleSwitch'
import LoadingSpinner from '$components/LoadingSpinner'
import EmptyState from '$components/EmptyState'
import MS from '$components/MS'
import { workflowApi } from '$services/workflowApi'
import { formatDate } from '$utils/format'
import type { Schedule } from '$types/workflow'

function ScheduleStatus({ status }: { status: 'active' | 'paused' }) {
  const cfg =
    status === 'active'
      ? { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Active' }
      : { bg: 'rgba(154,166,182,0.16)', color: 'var(--fg-3)', label: 'Paused' }
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        gap: 6,
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 999,
        fontSize: 11,
        padding: '3px 8px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {cfg.label}
    </span>
  )
}

/** Schedules page: cron-triggered workflow runs backed by /api/cron. */
export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [workflowNames, setWorkflowNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const [schedRes, wfRes] = await Promise.all([
        workflowApi.schedules.list(),
        workflowApi.workflows.list(),
      ])
      setSchedules(schedRes.schedules)
      setWorkflowNames(Object.fromEntries(wfRes.workflows.map(w => [w.id, w.name])))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleToggle = async (schedule: Schedule, enabled: boolean) => {
    // Optimistic update; revert on failure.
    setSchedules(prev => prev.map(s => (s.id === schedule.id ? { ...s, enabled } : s)))
    try {
      await workflowApi.schedules.toggle(schedule.id, enabled)
    } catch (e) {
      console.error('Failed to toggle schedule:', e)
      setSchedules(prev => prev.map(s => (s.id === schedule.id ? { ...s, enabled: !enabled } : s)))
    }
  }

  const handleDelete = async (schedule: Schedule) => {
    if (!window.confirm('Delete this schedule?')) return
    try {
      await workflowApi.schedules.delete(schedule.id)
      setSchedules(prev => prev.filter(s => s.id !== schedule.id))
    } catch (e) {
      console.error('Failed to delete schedule:', e)
    }
  }

  const handleCreate = async () => {
    const wfEntries = Object.entries(workflowNames)
    if (wfEntries.length === 0) {
      window.alert('Create a workflow first before scheduling it.')
      return
    }
    const menu = wfEntries.map(([, name], i) => `${i + 1}. ${name}`).join('\n')
    const pick = window.prompt(`Schedule which workflow?\n${menu}\n\nEnter a number:`)
    if (!pick) return
    const entry = wfEntries[Number(pick) - 1] as [string, string] | undefined
    if (!entry) return
    const description = window.prompt('When should it run? (e.g. "every day at 9am")')
    if (!description?.trim()) return
    try {
      await workflowApi.schedules.create({
        target_workflow_id: entry[0],
        schedule_description: description.trim(),
        timezone: 'UTC',
      })
      await load()
    } catch (e) {
      console.error('Failed to create schedule:', e)
      window.alert(e instanceof Error ? e.message : 'Failed to create schedule')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 48px' }}>
        {/* Header */}
        <div className="flex items-end justify-between" style={{ marginBottom: 22, gap: 16 }}>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: 'var(--fg-1)',
                margin: 0,
              }}
            >
              Schedules
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--fg-4)', marginTop: 3 }}>
              Cron-triggered workflow runs
            </div>
          </div>
          <ActionButton
            variant="primary"
            size="sm"
            icon={<MS name="add" size={16} />}
            label="New schedule"
            onClick={() => void handleCreate()}
          />
        </div>

        {/* Cron list */}
        <div
          style={{
            overflow: 'hidden',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-card, 12px)',
          }}
        >
          {loading ? (
            <LoadingSpinner size="sm" className="py-10" />
          ) : error ? (
            <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
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
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--r-btn, 8px)',
                      background: s.enabled ? 'var(--acc-soft)' : 'var(--bg-surface-3)',
                      color: s.enabled ? 'var(--acc-text, var(--aurora-300))' : 'var(--fg-4)',
                    }}
                  >
                    <MS name="schedule" size={19} />
                  </div>
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
                  <ScheduleStatus status={s.enabled ? 'active' : 'paused'} />
                  <ToggleSwitch checked={s.enabled} onChange={v => void handleToggle(s, v)} />
                  <ActionIcon
                    size={30}
                    icon={<MS name="delete" size={15} />}
                    title="Delete"
                    danger
                    onClick={() => void handleDelete(s)}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
