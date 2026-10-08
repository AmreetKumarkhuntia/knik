import { Banner, Input, Modal, Select } from '$components'
import Button from '$components/buttons/Button'
import type { ScheduleFormProps } from '$types/sections/schedule-manager'

export default function ScheduleForm({
  isOpen,
  onClose,
  onSubmit,
  workflows,
  draft,
  onDraftChange,
  error,
}: ScheduleFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Schedule">
      <form
        className="space-y-4"
        onSubmit={event => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div>
          <label htmlFor="schedule-workflow" className="block text-sm mb-2">
            Target Workflow
          </label>
          <Select
            id="schedule-workflow"
            presentation="native"
            value={draft.target_workflow_id}
            onChange={value => onDraftChange({ ...draft, target_workflow_id: value })}
            options={[
              { value: '', label: 'Select workflow…' },
              ...workflows.map(workflow => ({ value: workflow.id, label: workflow.name })),
            ]}
            required
          />
        </div>
        <div>
          <label htmlFor="schedule-description" className="block text-sm mb-2">
            Schedule
          </label>
          <Input
            id="schedule-description"
            value={draft.schedule_description}
            onChange={event =>
              onDraftChange({ ...draft, schedule_description: event.target.value })
            }
            placeholder="e.g. every day at 9am"
            required
          />
        </div>
        <div>
          <label htmlFor="schedule-timezone" className="block text-sm mb-2">
            Timezone
          </label>
          <Input
            id="schedule-timezone"
            value={draft.timezone ?? 'UTC'}
            onChange={event => onDraftChange({ ...draft, timezone: event.target.value })}
            placeholder="UTC"
          />
        </div>
        {error && <Banner variant="danger">{error}</Banner>}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save schedule
          </Button>
        </div>
      </form>
    </Modal>
  )
}
