import { useId } from 'react'
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
  const hintId = useId()
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New schedule">
      <form
        className="flex flex-col gap-3.5"
        onSubmit={event => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div>
          <label htmlFor="schedule-workflow" className="mb-2 block text-label text-fg-3">
            Target Workflow
          </label>
          <Select
            id="schedule-workflow"
            presentation="native"
            className="min-h-[38px] w-full"
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
          <label htmlFor="schedule-description" className="mb-2 block text-label text-fg-3">
            Schedule
          </label>
          <Input
            id="schedule-description"
            className="min-h-[38px]"
            aria-describedby={hintId}
            value={draft.schedule_description}
            onChange={event =>
              onDraftChange({ ...draft, schedule_description: event.target.value })
            }
            placeholder="e.g. every day at 9am"
            required
          />
          <p id={hintId} className="mt-1.5 text-caption text-fg-4">
            Natural language — the scheduler parses it.
          </p>
        </div>
        <div>
          <label htmlFor="schedule-timezone" className="mb-2 block text-label text-fg-3">
            Timezone
          </label>
          <Input
            id="schedule-timezone"
            className="min-h-[38px] font-mono"
            value={draft.timezone ?? 'UTC'}
            onChange={event => onDraftChange({ ...draft, timezone: event.target.value })}
            placeholder="UTC"
          />
        </div>
        {error && <Banner variant="danger">{error}</Banner>}
        <div className="mt-1 flex justify-end gap-2">
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
