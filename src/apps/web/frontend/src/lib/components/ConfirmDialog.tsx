import { useEffect, useRef } from 'react'
import { confirmDialogVariants } from '$lib/constants'
import type { ConfirmDialogProps } from '$types/components'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const config = confirmDialogVariants[variant]

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-canvas/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-surfaceRaised border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl">{config.icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-foreground/70 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => void onCancel()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-secondary hover:text-foreground transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-foreground rounded-lg transition-colors disabled:opacity-50 ${config.confirmBtn}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
