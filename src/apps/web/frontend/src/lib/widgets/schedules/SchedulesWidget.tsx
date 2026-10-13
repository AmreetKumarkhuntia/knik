import { Banner, ConfirmDialog, MS, SectionHeader } from '$components'
import Button from '$components/buttons/Button'
import ScheduleListPanel from '$components/schedules/ScheduleListPanel'
import ScheduleForm from '$components/schedules/ScheduleForm'
import { useSchedulesView } from '$stores/views'
import { useFeedbackStore } from '$stores/feedback'

export default function SchedulesWidget() {
  const {
    schedules,
    workflows,
    creating,
    deletingId,
    draft,
    error,
    workflowNames,
    open,
    close,
    setDraft,
    setDeleting,
    toggle,
    confirmDelete,
    save: saveDraft,
  } = useSchedulesView()
  const addToast = useFeedbackStore(state => state.addToast)
  const save = () => {
    const result = saveDraft()
    if (result.ok) addToast('Schedule saved for this session. No jobs are executed.', 'success')
  }
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-6 sm:px-6">
        <SectionHeader
          className="mb-4"
          title="Schedules"
          subtitle="Session-only workflow schedules"
          actions={
            <Button
              variant="primary"
              size="sm"
              className="rounded-[11px] pl-2.5 pr-3.5"
              icon={<MS name="add" size={18} />}
              disabled={workflows.length === 0}
              title={workflows.length ? 'Add a schedule' : 'Create a workflow first'}
              onClick={open}
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
            onToggle={(schedule, enabled) => toggle(schedule.id, enabled)}
            onDelete={schedule => setDeleting(schedule.id)}
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
          isOpen={deletingId !== null}
          title="Delete schedule?"
          message="This removes the schedule from the current session."
          confirmLabel="Delete schedule"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  )
}
