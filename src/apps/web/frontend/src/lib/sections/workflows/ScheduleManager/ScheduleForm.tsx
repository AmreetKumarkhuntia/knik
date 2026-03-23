import { useState } from 'react'
import ActionButton from '$components/ActionButton'
import Modal from '$components/Modal'
import FormField from '$components/FormField'
import type { ScheduleFormProps } from '$types/sections/schedule-manager'
import type { ScheduleCreateRequest } from '$types/workflow'

export default function ScheduleForm({
  isOpen,
  onClose,
  onSubmit,
  workflows,
  initialData,
  loading = false,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleCreateRequest>({
    target_workflow_id: initialData?.target_workflow_id || '',
    schedule_description: initialData?.schedule_description || '',
    timezone: initialData?.timezone || 'UTC',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Schedule' : 'Create Schedule'}
    >
      <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
        <FormField
          label="Target Workflow"
          type="select"
          name="target_workflow_id"
          value={formData.target_workflow_id}
          onChange={(value: string) =>
            setFormData(prev => ({ ...prev, target_workflow_id: value }))
          }
          options={workflows.map(w => ({ value: w.id, label: w.name }))}
          required
        />
        <FormField
          label="Schedule"
          type="text"
          name="schedule_description"
          value={formData.schedule_description}
          onChange={(value: string) =>
            setFormData(prev => ({ ...prev, schedule_description: value }))
          }
          placeholder="e.g. every 5 minutes, daily at 9am, every Monday at 2pm"
          required
        />
        <FormField
          label="Timezone"
          type="text"
          name="timezone"
          value={formData.timezone}
          onChange={(value: string) => setFormData(prev => ({ ...prev, timezone: value }))}
          placeholder="UTC"
        />
        <div className="flex justify-end gap-3 pt-4">
          <ActionButton label="Cancel" variant="ghost" onClick={onClose} />
          <ActionButton
            label={loading ? 'Saving...' : 'Save'}
            variant="primary"
            loading={loading}
            onClick={() => {
              void handleSubmit({ preventDefault: () => {} } as React.FormEvent)
            }}
          />
        </div>
      </form>
    </Modal>
  )
}
