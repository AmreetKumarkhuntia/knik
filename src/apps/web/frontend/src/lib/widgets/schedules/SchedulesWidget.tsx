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
            loading={false}
            error={null}
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
