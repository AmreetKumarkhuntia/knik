import type * as React from 'react'
import type { ReactNode } from 'react'

/** Available sizes for a modal dialog. */
export type ModalSize = 'sm' | 'md' | 'lg'

/** Props for a modal dialog. */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  /**
   * Draws no header bar: the title stays as the dialog's accessible name only, and the panel keeps
   * a slim frame because the content brings its own chrome (e.g. the command palette search row).
   */
  titleHidden?: boolean
  /** Drawn above the title inside the header, e.g. a confirm dialog's warning tile. */
  leading?: ReactNode
  /** Omits the header close button for dialogs whose own actions already include Cancel. */
  hideClose?: boolean
  className?: string
  size?: ModalSize
  placement?: 'center' | 'left' | 'right'
}

/** Props for a confirmation dialog. */
export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export interface PopoverProps {
  renderTrigger: (
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref: React.Ref<HTMLButtonElement> }
  ) => React.ReactNode
  role?: 'dialog' | 'listbox' | 'menu'
  label?: string
  autoFocus?: boolean
  content: React.ReactNode
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  /** Extra classes for the floating panel, appended after its own. */
  panelClassName?: string
}

export interface BannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success'
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}
