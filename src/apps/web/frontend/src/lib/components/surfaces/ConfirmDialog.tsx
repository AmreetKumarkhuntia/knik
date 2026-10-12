import type { ConfirmDialogProps } from '$types/components/surfaces'
import Button from '../buttons/Button'
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
      <p className="text-fg-2 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={() => void onConfirm()}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
