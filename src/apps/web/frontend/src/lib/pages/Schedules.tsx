import { useState, useEffect } from 'react'
import { ActionButton, MS } from '$components'
import { PaneHeader } from '$widgets'
import ScheduleListPanel from '$sections/schedules/ScheduleListPanel'
import { workflowApi } from '$services/workflowApi'
import type { Schedule } from '$types/workflow'

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
        <PaneHeader
          title="Schedules"
          subtitle="Cron-triggered workflow runs"
          style={{ marginBottom: 22 }}
          right={
            <ActionButton
              variant="primary"
              size="sm"
              icon={<MS name="add" size={16} />}
              label="New schedule"
              onClick={() => void handleCreate()}
            />
          }
        />
        <ScheduleListPanel
          schedules={schedules}
          workflowNames={workflowNames}
          loading={loading}
          error={error}
          onToggle={(s, v) => void handleToggle(s, v)}
          onDelete={s => void handleDelete(s)}
        />
      </div>
    </div>
  )
}
