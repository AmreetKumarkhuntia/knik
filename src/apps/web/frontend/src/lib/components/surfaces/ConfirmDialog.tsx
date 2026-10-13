import type { ConfirmDialogProps } from '$types/components/surfaces'
import Button from '../buttons/Button'
import MS from '../display/MS'
import Modal from './Modal'
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <span className="flex items-center justify-center w-10 h-10 mb-3 rounded-[12px] bg-[var(--danger-bg)] text-[var(--danger)]">
        <MS name="warning" size={20} />
      </span>
      <p className="text-body text-fg-3 text-pretty">{message}</p>
      <div className="flex justify-end gap-2 mt-[18px]">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" className="font-semibold" onClick={() => void onConfirm()}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
