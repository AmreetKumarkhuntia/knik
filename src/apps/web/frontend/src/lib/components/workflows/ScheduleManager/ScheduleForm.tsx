import { useState } from 'react'
import type { Schedule, ScheduleCreateRequest } from '$types/workflow'
import { ActionButton, Modal, FormField } from '$common'

interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ScheduleCreateRequest) => Promise<void>
  workflows: Array<{ id: string; name: string }>
  initialData?: Schedule
  loading?: boolean
}

export default function ScheduleForm({
  isOpen,
  onClose,
  onSubmit,
  workflows,
  initialData,
  loading = false,
}: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleCreateRequest>({
    workflow_id: initialData?.workflow_id || '',
    trigger_workflow_id: initialData?.trigger_workflow_id || '',
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
          label="Workflow"
          type="select"
          name="workflow_id"
          value={formData.workflow_id}
          onChange={(value: string) => setFormData(prev => ({ ...prev, workflow_id: value }))}
          options={workflows.map(w => ({ value: w.id, label: w.name }))}
          required
        />
        <FormField
          label="Trigger Workflow"
          type="select"
          name="trigger_workflow_id"
          value={formData.trigger_workflow_id}
          onChange={(value: string) =>
            setFormData(prev => ({ ...prev, trigger_workflow_id: value }))
          }
          options={workflows.map(w => ({ value: w.id, label: w.name }))}
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
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          />
        </div>
      </form>
    </Modal>
  )
}
