import type { ConfirmDialogProps } from '$types/components/surfaces'
import Button from '../buttons/Button'
import Modal from './Modal'
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onCancel()
      }}
      title={title}
      size="sm"
    >
      <p className="text-fg-2 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button disabled={loading} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'info' ? 'primary' : variant}
          loading={loading}
          onClick={() => {
            void onConfirm()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
