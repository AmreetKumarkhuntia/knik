import type { ScheduleDraft } from '$types/demo-session'

export interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  workflows: Array<{ id: string; name: string }>
  draft: ScheduleDraft
  onDraftChange: (draft: ScheduleDraft) => void
  error: string | null
}
