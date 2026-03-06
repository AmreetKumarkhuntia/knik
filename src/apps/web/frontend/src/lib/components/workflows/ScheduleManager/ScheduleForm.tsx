import { useState } from 'react'
import type { Schedule, ScheduleCreateRequest } from '$types/workflow'
import { ActionButton } from '../common'

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-6">
          {initialData ? 'Edit Schedule' : 'Create Schedule'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Workflow</label>
            <select
              value={formData.workflow_id}
              onChange={e => setFormData(prev => ({ ...prev, workflow_id: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
              required
            >
              <option value="">Select a workflow</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Trigger Workflow</label>
            <select
              value={formData.trigger_workflow_id}
              onChange={e =>
                setFormData(prev => ({ ...prev, trigger_workflow_id: e.target.value }))
              }
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
              required
            >
              <option value="">Select a trigger workflow</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Timezone</label>
            <input
              type="text"
              value={formData.timezone}
              onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
              placeholder="UTC"
            />
          </div>

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
      </div>
    </div>
  )
}
