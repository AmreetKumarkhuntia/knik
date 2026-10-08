import { useState } from 'react'
import { Banner, ConfirmDialog, MS, SectionHeader } from '$components'
import Button from '$components/buttons/Button'
import ScheduleListPanel from '$components/schedules/ScheduleListPanel'
import ScheduleForm from '$components/schedules/ScheduleForm'
import { useDemoSession } from '$widgets/session/useDemoSession'
import type { Schedule } from '$types/workflow'
import type { ScheduleDraft } from '$types/demo-session'

export default function SchedulesWidget() {
  const schedules = useDemoSession(state => state.schedules)
  const workflows = useDemoSession(state => state.workflows)
  const addSchedule = useDemoSession(state => state.addSchedule)
  const toggleSchedule = useDemoSession(state => state.toggleSchedule)
  const deleteSchedule = useDemoSession(state => state.deleteSchedule)
  const addToast = useDemoSession(state => state.addToast)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Schedule | null>(null)
  const [draft, setDraft] = useState<ScheduleDraft>({
    target_workflow_id: '',
    schedule_description: '',
    timezone: 'UTC',
  })
  const [error, setError] = useState<string | null>(null)
  const workflowNames = Object.fromEntries(workflows.map(workflow => [workflow.id, workflow.name]))
  const close = () => {
    setCreating(false)
    setError(null)
    setDraft({ target_workflow_id: '', schedule_description: '', timezone: 'UTC' })
  }
  const save = () => {
    if (
      !draft.target_workflow_id ||
      !workflows.some(workflow => workflow.id === draft.target_workflow_id)
    ) {
      setError('Select a workflow available in this session.')
      return
    }
    if (!draft.schedule_description.trim()) {
      setError('Enter a schedule description.')
      return
    }
    const timezone = draft.timezone?.trim() || 'UTC'
    try {
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format()
    } catch {
      setError('Enter a valid timezone, such as UTC or Asia/Kolkata.')
      return
    }
    const result = addSchedule({
      ...draft,
      schedule_description: draft.schedule_description.trim(),
      timezone,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    close()
    addToast('Schedule saved for this session. No jobs are executed.', 'success')
  }
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 pb-12">
        <SectionHeader
          title="Schedules"
          subtitle="Session-only workflow schedules"
          actions={
            <Button
              variant="primary"
              size="sm"
              icon={<MS name="add" size={16} />}
              disabled={workflows.length === 0}
              title={workflows.length ? 'Add a schedule' : 'Create a workflow first'}
              onClick={() => setCreating(true)}
            >
              New schedule
            </Button>
          }
        />
        <Banner variant="info">
          Schedules are previews for this session. No jobs are scheduled or executed.
          {workflows.length === 0 ? ' Create a workflow to add a schedule.' : ''}
        </Banner>
        <div className="mt-4">
          <ScheduleListPanel
            schedules={schedules}
            workflowNames={workflowNames}
            loading={false}
            error={null}
            onToggle={(schedule, enabled) => toggleSchedule(schedule.id, enabled)}
            onDelete={setDeleting}
          />
        </div>
        {creating && (
          <ScheduleForm
            isOpen
            onClose={close}
            onSubmit={save}
            workflows={workflows}
            draft={draft}
            onDraftChange={setDraft}
            error={error}
          />
        )}
        <ConfirmDialog
          isOpen={deleting !== null}
          title="Delete schedule?"
          message="This removes the schedule from the current session."
          confirmLabel="Delete schedule"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            if (deleting) deleteSchedule(deleting.id)
            setDeleting(null)
          }}
        />
      </div>
    </div>
  )
}
